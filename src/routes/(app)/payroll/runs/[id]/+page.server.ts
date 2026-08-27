import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { processPayrollRunForWorkspace } from '$lib/server/payroll/process-run';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import { listPayrollPayslipsForRun } from '$lib/server/repositories/payroll-payslips';
import {
	deletePayrollRunForWorkspace,
	getPayrollRunForWorkspace
} from '$lib/server/repositories/payroll-runs';
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
import {
	PAYROLL_RUN_ALREADY_PROCESSED_MESSAGE,
	PAYROLL_RUN_DELETE_FAILED_MESSAGE,
	PAYROLL_RUN_DELETE_PROCESSING_MESSAGE,
	PAYROLL_RUN_NOT_FOUND_MESSAGE,
	PAYROLL_RUN_PROCESS_FAILED_MESSAGE,
	PAYROLL_RUN_PROCESSED_MESSAGE
} from '$lib/shared/payroll/messages';
import { z } from 'zod';

const processRunSchema = z.object({});

export const load: PageServerLoad = async ({ parent, params, isDataRequest }) => {
	const { workspace, canManagePayroll } = await parent();

	if (!workspace || !canManagePayroll) {
		error(403, 'Payroll access required');
	}

	const run = await getPayrollRunForWorkspace({
		workspaceId: workspace.workspaceId,
		runId: params.id
	});

	if (!run) {
		error(404, PAYROLL_RUN_NOT_FOUND_MESSAGE);
	}

	const payslipsQuery = listPayrollPayslipsForRun({
		workspaceId: workspace.workspaceId,
		runId: params.id,
		page: 1,
		limit: 100
	});

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const form = await superValidate(zod4(processRunSchema));

	return {
		run,
		payslips: isDataRequest ? payslipsQuery.then((result) => result.items) : (await payslipsQuery).items,
		currency: settings.currency,
		form
	};
};

export const actions: Actions = {
	process: async (event) => {
		const { params, locals, url } = event;
		if (!locals.user) {
			return fail(401, { message: 'Authentication required.' });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManagePayroll(workspace.role)) {
			return fail(403, { message: 'Payroll access required.' });
		}

		const form = await superValidate(zod4(processRunSchema));

		const result = await processPayrollRunForWorkspace({
			workspaceId: workspace.workspaceId,
			runId: params.id,
			userId: locals.user.id
		});

		if (!result.ok) {
			if (result.code === 'NOT_FOUND') {
				return fail(404, { form, message: PAYROLL_RUN_NOT_FOUND_MESSAGE });
			}

			if (result.code === 'INVALID_STATUS') {
				return message(form, PAYROLL_RUN_ALREADY_PROCESSED_MESSAGE, { status: 409 });
			}

			return message(form, PAYROLL_RUN_PROCESS_FAILED_MESSAGE, { status: 500 });
		}

		recordPayrollSecurityEventInBackground(event, {
			workspaceId: workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_RUN_PROCESSED,
			...buildSecurityEventRequestContext(event),
			metadata: {
				detail: `Processed pay run "${result.run.title}".`,
				runId: result.run.id,
				title: result.run.title
			}
		});

		return message(form, PAYROLL_RUN_PROCESSED_MESSAGE);
	},

	delete: async (event) => {
		const { params, locals, url } = event;
		if (!locals.user) {
			return fail(401, { message: 'Authentication required.' });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManagePayroll(workspace.role)) {
			return fail(403, { message: 'Payroll access required.' });
		}

		const run = await getPayrollRunForWorkspace({
			workspaceId: workspace.workspaceId,
			runId: params.id
		});

		if (!run) {
			return fail(404, { message: PAYROLL_RUN_NOT_FOUND_MESSAGE });
		}

		const result = await deletePayrollRunForWorkspace({
			workspaceId: workspace.workspaceId,
			runId: params.id
		});

		if (!result.ok) {
			if (result.code === 'NOT_FOUND') {
				return fail(404, { message: PAYROLL_RUN_NOT_FOUND_MESSAGE });
			}

			if (result.code === 'PROCESSING') {
				return fail(409, { message: PAYROLL_RUN_DELETE_PROCESSING_MESSAGE });
			}

			return fail(500, { message: PAYROLL_RUN_DELETE_FAILED_MESSAGE });
		}

		recordPayrollSecurityEventInBackground(event, {
			workspaceId: workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_RUN_DELETED,
			...buildSecurityEventRequestContext(event),
			metadata: {
				detail: `Deleted pay run "${run.title}".`,
				runId: run.id,
				title: run.title
			}
		});

		throw redirect(303, '/payroll/runs?deleted=1');
	}
};
