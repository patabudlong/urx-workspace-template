import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	getPayrollSettingsForWorkspace,
	upsertPayrollSettingsForWorkspace
} from '$lib/server/repositories/payroll-settings';
import {
	getDefaultPayrollCurrency,
	getDefaultPayrollTimezone
} from '$lib/server/payroll/config';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManagePayroll } from '$lib/shared/payroll/access';
import { PAY_FREQUENCY_LABELS } from '$lib/shared/payroll/frequency';
import {
	PAYROLL_SETTINGS_SAVED_MESSAGE,
	PAYROLL_SETTINGS_SAVE_FAILED_MESSAGE
} from '$lib/shared/payroll/messages';
import {
	createPayrollSettingsDefaults,
	payrollSettingsSchema
} from '$lib/shared/payroll/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManagePayroll: canManage } = await parent();
	const defaults = createPayrollSettingsDefaults({
		timezone: getDefaultPayrollTimezone(),
		currency: getDefaultPayrollCurrency()
	});

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(payrollSettingsSchema), { defaults }),
			settingsConfigured: false
		};
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const form = await superValidate(
		{
			payFrequency: settings.payFrequency,
			timezone: settings.timezone,
			currency: settings.currency,
			weekStartDay: settings.weekStartDay ?? defaults.weekStartDay,
			periodAnchorDate: settings.periodAnchorDate ?? ''
		},
		zod4(payrollSettingsSchema)
	);

	return {
		form,
		settingsConfigured: settings.configured,
		frequencyLabels: PAY_FREQUENCY_LABELS
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(payrollSettingsSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManagePayroll(workspace.role)) {
			return fail(403, { form, message: 'Payroll access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await upsertPayrollSettingsForWorkspace({
				workspaceId: workspace.workspaceId,
				data: form.data
			});
		} catch {
			return message(form, PAYROLL_SETTINGS_SAVE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PAYROLL_SETTINGS_SAVED_MESSAGE);
	}
};
