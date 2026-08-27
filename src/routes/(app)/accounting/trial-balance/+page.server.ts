import type { PageServerLoad } from './$types';
import { buildTrialBalanceForWorkspace } from '$lib/server/repositories/accounting-trial-balance';
import { listAccountingPeriodsForWorkspace } from '$lib/server/repositories/accounting-periods';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace, canManageAccounting } = await parent();
	const periodId = url.searchParams.get('periodId');

	if (!workspace || !canManageAccounting) {
		return { trialBalance: null, periods: [], selectedPeriodId: null };
	}

	const periods = await listAccountingPeriodsForWorkspace(workspace.workspaceId);
	const selectedPeriodId = periodId ?? periods[0]?.id ?? null;
	const trialBalance = selectedPeriodId
		? await buildTrialBalanceForWorkspace({
				workspaceId: workspace.workspaceId,
				periodId: selectedPeriodId
			})
		: null;

	return {
		trialBalance,
		periods,
		selectedPeriodId
	};
};
