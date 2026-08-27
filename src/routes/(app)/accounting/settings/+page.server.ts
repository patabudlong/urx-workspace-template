import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { getDefaultAccountingTimezone } from '$lib/server/accounting/config';
import { upsertAccountingSettingsForWorkspace } from '$lib/server/repositories/accounting-settings';
import { getAccountingSettingsForWorkspace } from '$lib/server/repositories/accounting-settings';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageAccounting } from '$lib/shared/accounting/access';
import {
	ACCOUNTING_SETTINGS_SAVED_MESSAGE,
	ACCOUNTING_SETTINGS_SAVE_FAILED_MESSAGE
} from '$lib/shared/accounting/messages';
import { FISCAL_MONTHS, accountingSettingsSchema, createAccountingSettingsDefaults } from '$lib/shared/accounting/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageAccounting: canManage } = await parent();
	const defaults = createAccountingSettingsDefaults({
		timezone: getDefaultAccountingTimezone()
	});

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(accountingSettingsSchema), { defaults }),
			settingsConfigured: false,
			fiscalMonths: FISCAL_MONTHS
		};
	}

	const settings = await getAccountingSettingsForWorkspace(workspace.workspaceId);
	const form = await superValidate(
		{
			companyName: settings.companyName,
			tin: settings.tin ?? '',
			addressLine1: settings.addressLine1 ?? '',
			addressLine2: settings.addressLine2 ?? '',
			city: settings.city ?? '',
			province: settings.province ?? '',
			fiscalYearStartMonth: settings.fiscalYearStartMonth,
			timezone: settings.timezone,
			baseCurrency: settings.baseCurrency
		},
		zod4(accountingSettingsSchema)
	);

	return {
		form,
		settingsConfigured: settings.configured,
		fiscalMonths: FISCAL_MONTHS
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(accountingSettingsSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageAccounting(workspace.role)) {
			return fail(403, { form, message: 'Accounting access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await upsertAccountingSettingsForWorkspace({
				workspaceId: workspace.workspaceId,
				data: form.data
			});
		} catch {
			return message(form, ACCOUNTING_SETTINGS_SAVE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, ACCOUNTING_SETTINGS_SAVED_MESSAGE);
	}
};
