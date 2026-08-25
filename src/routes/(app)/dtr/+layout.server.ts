import type { LayoutServerLoad } from './$types';
import { canManageDtr } from '$lib/shared/dtr/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import { requireWorkspacePackage } from '$lib/server/workspace-packages/access';
import { findPayrollEmployeeForWorkspaceUser } from '$lib/server/repositories/payroll-employees';

export const load: LayoutServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();
	requireWorkspacePackage(workspace, WORKSPACE_PACKAGE_IDS.DTR);

	const canManage = canManageDtr(workspace.role);
	let hasLinkedEmployee = false;

	if (locals.user?.id) {
		const employee = await findPayrollEmployeeForWorkspaceUser({
			workspaceId: workspace.workspaceId,
			userId: locals.user.id,
			email: locals.user.email
		});
		hasLinkedEmployee = Boolean(employee);
	}

	return {
		canManageDtr: canManage,
		hasLinkedPayrollEmployee: hasLinkedEmployee
	};
};
