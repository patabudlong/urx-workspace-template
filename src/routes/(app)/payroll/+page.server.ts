import type { PageServerLoad } from './$types';
import { countPayrollRunsForWorkspace } from '$lib/server/repositories/payroll-runs';

export const load: PageServerLoad = async ({ parent, isDataRequest }) => {
	const { workspace, canManagePayroll } = await parent();

	if (!workspace || !canManagePayroll) {
		return {
			runCount: 0
		};
	}

	const runCountQuery = countPayrollRunsForWorkspace(workspace.workspaceId);

	return {
		runCount: isDataRequest ? runCountQuery : await runCountQuery
	};
};
