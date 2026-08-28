import { findWorkspaceById } from '$lib/server/repositories/workspaces';
import { listDeployedWorkspacePackageIds } from '$lib/server/workspace-packages/installed';
import { isWorkspacePackageEnabled, WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';

export async function isCrmActiveForWorkspace(workspaceId: string): Promise<boolean> {
	const workspace = await findWorkspaceById(workspaceId);

	if (!workspace) {
		return false;
	}

	const deployed = await listDeployedWorkspacePackageIds();

	if (!deployed.includes(WORKSPACE_PACKAGE_IDS.CRM)) {
		return false;
	}

	return isWorkspacePackageEnabled(workspace.enabledPackages, WORKSPACE_PACKAGE_IDS.CRM);
}
