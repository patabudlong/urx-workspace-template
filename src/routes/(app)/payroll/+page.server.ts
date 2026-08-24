import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { countPayrollEmployeesForWorkspace } from '$lib/server/repositories/payroll-employees';
import { countPayrollRunsForWorkspace } from '$lib/server/repositories/payroll-runs';

export const load: PageServerLoad = async ({ parent, isDataRequest }) => {
	const { workspace, canManagePayroll, hasLinkedPayrollEmployee } = await parent();

	if (!canManagePayroll && hasLinkedPayrollEmployee) {
		redirect(302, '/payroll/payslips');
	}

	if (!workspace || !canManagePayroll) {
		return {
			runCount: 0,
			employeeCount: 0
		};
	}

	const countsQuery = Promise.all([
		countPayrollRunsForWorkspace(workspace.workspaceId),
		countPayrollEmployeesForWorkspace(workspace.workspaceId)
	]).then(([runCount, employeeCount]) => ({ runCount, employeeCount }));

	if (isDataRequest) {
		return {
			runCount: countsQuery.then((counts) => counts.runCount),
			employeeCount: countsQuery.then((counts) => counts.employeeCount)
		};
	}

	const counts = await countsQuery;

	return {
		runCount: counts.runCount,
		employeeCount: counts.employeeCount
	};
};
