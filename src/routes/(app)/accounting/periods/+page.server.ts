import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	AccountingPeriodActionError,
	closeAccountingPeriodForWorkspace,
	getFirstFiscalPeriodForWorkspace,
	listAccountingPeriodsForWorkspace,
	lockAccountingPeriodForWorkspace,
	reopenAccountingPeriodForWorkspace
} from '$lib/server/repositories/accounting-periods';
import { countJournalEntriesByPeriodForWorkspace, hasOpeningBalanceForPeriod } from '$lib/server/repositories/accounting-journal-entries';
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
	ACCOUNTING_PERIOD_LOCK_FAILED_MESSAGE,
	ACCOUNTING_PERIOD_REOPENED_MESSAGE,
	ACCOUNTING_PERIOD_REOPEN_FAILED_MESSAGE
} from '$lib/shared/accounting/messages';
import { closePeriodSchema } from '$lib/shared/accounting/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageAccounting: canManage } = await parent();

	if (!workspace || !canManage) {
		return { periods: [], firstPeriodId: null };
	}

	const workspaceId = workspace.workspaceId;
	const [periods, journalCounts, firstPeriod] = await Promise.all([
		listAccountingPeriodsForWorkspace(workspaceId),
		countJournalEntriesByPeriodForWorkspace(workspaceId),
		getFirstFiscalPeriodForWorkspace(workspaceId)
	]);

	const openingBalanceByPeriod: Record<string, boolean> = {};

	if (firstPeriod) {
		openingBalanceByPeriod[firstPeriod.id] = await hasOpeningBalanceForPeriod({
			workspaceId,
			periodId: firstPeriod.id
		});
	}

	return {
		firstPeriodId: firstPeriod?.id ?? null,
		periods: periods.map((period) => ({
			...period,
			journalEntryCount: journalCounts[period.id] ?? 0,
			requiresOpeningBalance: firstPeriod?.id === period.id,
			hasOpeningBalance: openingBalanceByPeriod[period.id] ?? false
		}))
	};
};

async function resolveWorkspaceAction(
	locals: { user?: { id: string } | null },
	url: URL
) {
	if (!locals.user) {
		return { error: fail(401, { message: 'Authentication required.' }) };
	}

	const workspaces = await listUserWorkspaceContexts(locals.user.id);
	const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

	if (!workspace || !canManageAccounting(workspace.role)) {
		return { error: fail(403, { message: 'Accounting access required.' }) };
	}

	return { workspace };
}

export const actions: Actions = {
	close: async ({ request, url, locals }) => {
		const formData = await request.formData();
		const periodId = String(formData.get('periodId') ?? '');
		const parsed = closePeriodSchema.safeParse({ periodId });

		if (!parsed.success) {
			return fail(400, { message: ACCOUNTING_PERIOD_CLOSE_FAILED_MESSAGE });
		}

		const context = await resolveWorkspaceAction(locals, url);
		if ('error' in context) {
			return context.error;
		}

		try {
			await closeAccountingPeriodForWorkspace({
				workspaceId: context.workspace.workspaceId,
				periodId: parsed.data.periodId,
				userId: locals.user?.id
			});
		} catch (error) {
			return fail(400, {
				message:
					error instanceof AccountingPeriodActionError
						? error.message
						: ACCOUNTING_PERIOD_CLOSE_FAILED_MESSAGE
			});
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

		const context = await resolveWorkspaceAction(locals, url);
		if ('error' in context) {
			return context.error;
		}

		const period = await lockAccountingPeriodForWorkspace({
			workspaceId: context.workspace.workspaceId,
			periodId: parsed.data.periodId
		});

		if (!period) {
			return fail(400, { message: ACCOUNTING_PERIOD_LOCK_FAILED_MESSAGE });
		}

		return { message: ACCOUNTING_PERIOD_LOCKED_MESSAGE };
	},
	reopen: async ({ request, url, locals }) => {
		const formData = await request.formData();
		const periodId = String(formData.get('periodId') ?? '');
		const parsed = closePeriodSchema.safeParse({ periodId });

		if (!parsed.success) {
			return fail(400, { message: ACCOUNTING_PERIOD_REOPEN_FAILED_MESSAGE });
		}

		const context = await resolveWorkspaceAction(locals, url);
		if ('error' in context) {
			return context.error;
		}

		try {
			await reopenAccountingPeriodForWorkspace({
				workspaceId: context.workspace.workspaceId,
				periodId: parsed.data.periodId
			});
		} catch (error) {
			return fail(400, {
				message:
					error instanceof AccountingPeriodActionError
						? error.message
						: ACCOUNTING_PERIOD_REOPEN_FAILED_MESSAGE
			});
		}

		return { message: ACCOUNTING_PERIOD_REOPENED_MESSAGE };
	}
};
