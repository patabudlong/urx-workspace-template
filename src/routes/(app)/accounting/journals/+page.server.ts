import type { PageServerLoad } from './$types';
import { listAccountingJournalEntriesForWorkspace } from '$lib/server/repositories/accounting-journal-entries';
import { listAccountingPeriodsForWorkspace } from '$lib/server/repositories/accounting-periods';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace, canManageAccounting } = await parent();
	const periodId = url.searchParams.get('periodId') ?? undefined;
	const sourceParam = url.searchParams.get('source');
	const source =
		sourceParam === 'opening_balance' || sourceParam === 'manual' ? sourceParam : undefined;

	if (!workspace || !canManageAccounting) {
		return { entries: [], periods: [], selectedPeriodId: periodId ?? null, selectedSource: source ?? null };
	}

	const [entries, periods] = await Promise.all([
		listAccountingJournalEntriesForWorkspace({
			workspaceId: workspace.workspaceId,
			periodId,
			source
		}),
		listAccountingPeriodsForWorkspace(workspace.workspaceId)
	]);

	return {
		entries,
		periods,
		selectedPeriodId: periodId ?? null,
		selectedSource: source ?? null
	};
};
