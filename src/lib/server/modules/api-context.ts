import { isWorkspaceOwner } from '$lib/navigation/app-nav';
import { requireWorkspaceModuleApiContext } from '$lib/server/workspace-packages/access';
import type { WorkspacePackageId } from '$lib/shared/workspace-packages';

export async function requireWorkspaceModuleOwnerApiContext(input: {
	userId: string | undefined;
	url: URL;
	packageId: WorkspacePackageId;
	requestId?: string;
}) {
	return requireWorkspaceModuleApiContext({
		...input,
		requireRole: isWorkspaceOwner,
		forbiddenMessage: 'Only workspace owners can manage module integrations.'
	});
}
