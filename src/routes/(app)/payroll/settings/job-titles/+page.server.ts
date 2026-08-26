import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	getPayrollJobTitlesFormDefaults,
	getPayrollSettingsForWorkspace,
	savePayrollJobTitlesForWorkspace
} from '$lib/server/repositories/payroll-settings';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManagePayroll } from '$lib/shared/payroll/access';
import {
	buildSecurityEventRequestContext,
	recordPayrollSecurityEventInBackground
} from '$lib/server/security/record-security-event';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';
import { PAY_FREQUENCY_LABELS } from '$lib/shared/payroll/frequency';
import {
	PAYROLL_JOB_TITLES_SAVED_MESSAGE,
	PAYROLL_JOB_TITLES_SAVE_FAILED_MESSAGE
} from '$lib/shared/payroll/messages';
import {
	mapJobTitlesInputToDocument,
	payrollJobTitlesSchema
} from '$lib/shared/payroll/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManagePayroll: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(payrollJobTitlesSchema), {
				defaults: { titles: [] }
			}),
			payrollCurrency: 'PHP' as const,
			payFrequency: 'semi-monthly' as const,
			payFrequencyLabel: PAY_FREQUENCY_LABELS['semi-monthly']
		};
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const form = await superValidate(
		getPayrollJobTitlesFormDefaults(settings.jobTitles, settings.currency),
		zod4(payrollJobTitlesSchema)
	);

	return {
		form,
		payrollCurrency: settings.currency,
		payFrequency: settings.payFrequency,
		payFrequencyLabel: PAY_FREQUENCY_LABELS[settings.payFrequency]
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, url, locals } = event;
		const form = await superValidate(request, zod4(payrollJobTitlesSchema));

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
			const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
			await savePayrollJobTitlesForWorkspace({
				workspaceId: workspace.workspaceId,
				titles: mapJobTitlesInputToDocument(form.data.titles, settings.currency)
			});
		} catch {
			return message(form, PAYROLL_JOB_TITLES_SAVE_FAILED_MESSAGE, { status: 500 });
		}

		recordPayrollSecurityEventInBackground(event, {
			workspaceId: workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_SETTINGS_UPDATED,
			...buildSecurityEventRequestContext(event),
			metadata: {
				detail: `Updated ${form.data.titles.length} job title${form.data.titles.length === 1 ? '' : 's'}.`,
				section: 'job_titles',
				titleCount: form.data.titles.length
			}
		});

		return message(form, PAYROLL_JOB_TITLES_SAVED_MESSAGE);
	}
};
