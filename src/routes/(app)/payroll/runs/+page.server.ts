import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { buildSuggestedPayRunDefaults } from '$lib/server/payroll/suggestions';
import {
	createPayrollRunForWorkspace,
	listPayrollRunsForWorkspace
} from '$lib/server/repositories/payroll-runs';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
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
	PAYROLL_RUN_CREATED_MESSAGE,
	PAYROLL_RUN_CREATE_FAILED_MESSAGE
} from '$lib/shared/payroll/messages';
import { createPayrollRunSchema } from '$lib/shared/payroll/schemas';

const DEFAULT_LIMIT = 20;

export const load: PageServerLoad = async ({ parent, isDataRequest }) => {
	const { workspace, canManagePayroll: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(createPayrollRunSchema)),
			runs: [],
			total: 0,
			settingsConfigured: false,
			payFrequencyLabel: null
		};
	}

	const [suggestedDefaults, settings] = await Promise.all([
		buildSuggestedPayRunDefaults(workspace.workspaceId),
		getPayrollSettingsForWorkspace(workspace.workspaceId)
	]);

	const runsQuery = listPayrollRunsForWorkspace({
		workspaceId: workspace.workspaceId,
		page: 1,
		limit: DEFAULT_LIMIT
	});

	const form = await superValidate(suggestedDefaults, zod4(createPayrollRunSchema));

	return {
		form,
		runs: isDataRequest ? runsQuery.then((result) => result.items) : (await runsQuery).items,
		total: isDataRequest ? runsQuery.then((result) => result.total) : (await runsQuery).total,
		settingsConfigured: settings.configured,
		payFrequencyLabel: PAY_FREQUENCY_LABELS[settings.payFrequency]
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, url, locals } = event;
		const form = await superValidate(request, zod4(createPayrollRunSchema));

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
			const run = await createPayrollRunForWorkspace({
				workspaceId: workspace.workspaceId,
				data: form.data
			});

			recordPayrollSecurityEventInBackground(event, {
				workspaceId: workspace.workspaceId,
				actorUserId: locals.user.id,
				action: SECURITY_EVENT_ACTIONS.PAYROLL_RUN_CREATED,
				...buildSecurityEventRequestContext(event),
				metadata: {
					detail: `Created pay run "${run.title}" (${run.periodStart} to ${run.periodEnd}).`,
					runId: run.id,
					title: run.title,
					periodStart: run.periodStart,
					periodEnd: run.periodEnd
				}
			});
		} catch {
			return message(form, PAYROLL_RUN_CREATE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PAYROLL_RUN_CREATED_MESSAGE);
	}
};
