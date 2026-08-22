import type { LayoutServerLoad } from './$types';
import { canManageDtr } from '$lib/shared/dtr/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import { requireWorkspacePackage } from '$lib/server/workspace-packages/access';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { workspace } = await parent();
	requireWorkspacePackage(workspace, WORKSPACE_PACKAGE_IDS.DTR);

	return {
		canManageDtr: canManageDtr(workspace.role)
	};
};
