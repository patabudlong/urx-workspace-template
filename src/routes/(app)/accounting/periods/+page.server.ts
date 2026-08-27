import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	closeAccountingPeriodForWorkspace,
	listAccountingPeriodsForWorkspace,
	lockAccountingPeriodForWorkspace
} from '$lib/server/repositories/accounting-periods';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageAccounting } from '$lib/shared/accounting/access';
import {
	ACCOUNTING_PERIOD_CLOSED_MESSAGE,
	ACCOUNTING_PERIOD_CLOSE_FAILED_MESSAGE,
	ACCOUNTING_PERIOD_LOCKED_MESSAGE,
	ACCOUNTING_PERIOD_LOCK_FAILED_MESSAGE
} from '$lib/shared/accounting/messages';
import { closePeriodSchema } from '$lib/shared/accounting/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageAccounting: canManage } = await parent();

	if (!workspace || !canManage) {
		return { periods: [] };
	}

	const periods = await listAccountingPeriodsForWorkspace(workspace.workspaceId);
	return { periods };
};

export const actions: Actions = {
	close: async ({ request, url, locals }) => {
		const formData = await request.formData();
		const periodId = String(formData.get('periodId') ?? '');
		const parsed = closePeriodSchema.safeParse({ periodId });

		if (!parsed.success) {
			return fail(400, { message: ACCOUNTING_PERIOD_CLOSE_FAILED_MESSAGE });
		}

		if (!locals.user) {
			return fail(401, { message: 'Authentication required.' });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageAccounting(workspace.role)) {
			return fail(403, { message: 'Accounting access required.' });
		}

		const period = await closeAccountingPeriodForWorkspace({
			workspaceId: workspace.workspaceId,
			periodId: parsed.data.periodId
		});

		if (!period) {
			return fail(400, { message: ACCOUNTING_PERIOD_CLOSE_FAILED_MESSAGE });
		}

		return { message: ACCOUNTING_PERIOD_CLOSED_MESSAGE };
	},
	lock: async ({ request, url, locals }) => {
		const formData = await request.formData();
		const periodId = String(formData.get('periodId') ?? '');
		const parsed = closePeriodSchema.safeParse({ periodId });

		if (!parsed.success) {
			return fail(400, { message: ACCOUNTING_PERIOD_LOCK_FAILED_MESSAGE });
		}

		if (!locals.user) {
			return fail(401, { message: 'Authentication required.' });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageAccounting(workspace.role)) {
			return fail(403, { message: 'Accounting access required.' });
		}

		const period = await lockAccountingPeriodForWorkspace({
			workspaceId: workspace.workspaceId,
			periodId: parsed.data.periodId
		});

		if (!period) {
			return fail(400, { message: ACCOUNTING_PERIOD_LOCK_FAILED_MESSAGE });
		}

		return { message: ACCOUNTING_PERIOD_LOCKED_MESSAGE };
	}
};
