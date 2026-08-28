import type { LayoutServerLoad } from './$types';
import { canManageProjectManagement } from '$lib/shared/project-management/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import { requireWorkspacePackage } from '$lib/server/workspace-packages/access';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { workspace } = await parent();
	requireWorkspacePackage(workspace, WORKSPACE_PACKAGE_IDS.PROJECT_MANAGEMENT);

	return {
		canManageProjectManagement: canManageProjectManagement(workspace.role)
	};
};
