import { findWorkspaceById } from '$lib/server/repositories/workspaces';
import { isAccountingConfiguredForWorkspace } from '$lib/server/repositories/accounting-settings';
import { listDeployedWorkspacePackageIds } from '$lib/server/workspace-packages/installed';
import {
	isWorkspacePackageEnabled,
	WORKSPACE_PACKAGE_IDS
} from '$lib/shared/workspace-packages';

export async function isAccountingActiveForWorkspace(workspaceId: string): Promise<boolean> {
	const workspace = await findWorkspaceById(workspaceId);

	if (!workspace) {
		return false;
	}

	const deployed = await listDeployedWorkspacePackageIds();

	if (!deployed.includes(WORKSPACE_PACKAGE_IDS.ACCOUNTING)) {
		return false;
	}

	if (!isWorkspacePackageEnabled(workspace.enabledPackages, WORKSPACE_PACKAGE_IDS.ACCOUNTING)) {
		return false;
	}

	return await isAccountingConfiguredForWorkspace(workspaceId);
}
