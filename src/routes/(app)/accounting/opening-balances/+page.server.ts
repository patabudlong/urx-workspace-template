import type { PageServerLoad } from './$types';
import { listAccountingJournalEntriesForWorkspace } from '$lib/server/repositories/accounting-journal-entries';
import { hasOpeningBalanceForPeriod } from '$lib/server/repositories/accounting-journal-entries';
import { getFirstFiscalPeriodForWorkspace } from '$lib/server/repositories/accounting-periods';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageAccounting } = await parent();

	if (!workspace || !canManageAccounting) {
		return {
			entries: [],
			firstPeriod: null,
			hasOpeningBalance: false,
			canPostOpeningBalance: false
		};
	}

	const workspaceId = workspace.workspaceId;
	const firstPeriod = await getFirstFiscalPeriodForWorkspace(workspaceId);
	const hasOpeningBalance = firstPeriod
		? await hasOpeningBalanceForPeriod({
				workspaceId,
				periodId: firstPeriod.id
			})
		: false;

	const entries = await listAccountingJournalEntriesForWorkspace({
		workspaceId,
		source: 'opening_balance'
	});

	return {
		entries,
		firstPeriod,
		hasOpeningBalance,
		canPostOpeningBalance: Boolean(
			firstPeriod && firstPeriod.status === 'open' && !hasOpeningBalance
		)
	};
};
