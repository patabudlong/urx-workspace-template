import type { PageServerLoad } from './$types';
import { listPayrollEmployeesForWorkspace } from '$lib/server/repositories/payroll-employees';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';

const DEFAULT_LIMIT = 50;

export const load: PageServerLoad = async ({ parent, isDataRequest }) => {
	const { workspace, canManagePayroll: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			employees: [],
			payrollCurrency: 'PHP' as const
		};
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const employeesQuery = listPayrollEmployeesForWorkspace({
		workspaceId: workspace.workspaceId,
		page: 1,
		limit: DEFAULT_LIMIT
	}).then((result) => result.items);

	return {
		payrollCurrency: settings.currency,
		employees: isDataRequest ? employeesQuery : await employeesQuery
	};
};
