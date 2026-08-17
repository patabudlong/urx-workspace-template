import type { PageServerLoad } from './$types';
import { listPayrollRunsForWorkspace } from '$lib/server/repositories/payroll-runs';

const DEFAULT_LIMIT = 20;

export const load: PageServerLoad = async ({ parent, isDataRequest }) => {
	const { workspace, canManagePayroll } = await parent();

	if (!workspace || !canManagePayroll) {
		return {
			runs: [],
			total: 0
		};
	}

	const runsQuery = listPayrollRunsForWorkspace({
		workspaceId: workspace.workspaceId,
		page: 1,
		limit: DEFAULT_LIMIT
	}).then((result) => ({
		runs: result.items,
		total: result.total
	}));

	return {
		runs: isDataRequest ? runsQuery.then((result) => result.runs) : (await runsQuery).runs,
		total: isDataRequest ? runsQuery.then((result) => result.total) : (await runsQuery).total
	};
};
