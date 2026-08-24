import type { LayoutServerLoad } from './$types';
import { canManagePayroll } from '$lib/shared/payroll/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import { requireWorkspacePackage } from '$lib/server/workspace-packages/access';
import { findPayrollEmployeeForWorkspaceUser } from '$lib/server/repositories/payroll-employees';

export const load: LayoutServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();
	requireWorkspacePackage(workspace, WORKSPACE_PACKAGE_IDS.PAYROLL);

	const canManage = canManagePayroll(workspace.role);
	let hasLinkedEmployee = false;

	if (!canManage && locals.user?.id) {
		const employee = await findPayrollEmployeeForWorkspaceUser({
			workspaceId: workspace.workspaceId,
			userId: locals.user.id,
			email: locals.user.email
		});
		hasLinkedEmployee = Boolean(employee);
	}

	return {
		canManagePayroll: canManage,
		hasLinkedPayrollEmployee: hasLinkedEmployee
	};
};
