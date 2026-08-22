import type { LayoutServerLoad } from './$types';
import { canManagePayroll } from '$lib/shared/payroll/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import { requireWorkspacePackage } from '$lib/server/workspace-packages/access';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { workspace } = await parent();
	requireWorkspacePackage(workspace, WORKSPACE_PACKAGE_IDS.PAYROLL);

	return {
		canManagePayroll: canManagePayroll(workspace.role)
	};
};
