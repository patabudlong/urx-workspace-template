import type { LayoutServerLoad } from './$types';
import { canManageAccounting } from '$lib/shared/accounting/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import { requireWorkspacePackage } from '$lib/server/workspace-packages/access';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { workspace } = await parent();
	requireWorkspacePackage(workspace, WORKSPACE_PACKAGE_IDS.ACCOUNTING);

	return {
		canManageAccounting: canManageAccounting(workspace.role)
	};
};
