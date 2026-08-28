import type { PageServerLoad } from './$types';
import { countAccountingAccountsForWorkspace } from '$lib/server/repositories/accounting-accounts';
import { countAccountingJournalEntriesForWorkspace } from '$lib/server/repositories/accounting-journal-entries';
import { countOpenAccountingPeriodsForWorkspace } from '$lib/server/repositories/accounting-periods';
import { isAccountingConfiguredForWorkspace } from '$lib/server/repositories/accounting-settings';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageAccounting } = await parent();

	if (!workspace || !canManageAccounting) {
		return {
			settingsConfigured: false,
			accountCount: 0,
			journalCount: 0,
			openPeriodCount: 0
		};
	}

	const workspaceId = workspace.workspaceId;
	const [settingsConfigured, accountCount, journalCount, openPeriodCount] = await Promise.all([
		isAccountingConfiguredForWorkspace(workspaceId),
		countAccountingAccountsForWorkspace(workspaceId),
		countAccountingJournalEntriesForWorkspace(workspaceId),
		countOpenAccountingPeriodsForWorkspace(workspaceId)
	]);

	return {
		settingsConfigured,
		accountCount,
		journalCount,
		openPeriodCount
	};
};
