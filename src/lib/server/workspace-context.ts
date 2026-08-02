import { findWorkspaceBySlugOrId } from '$lib/server/repositories/workspaces';
import { listWorkspaceMembersByUserId } from '$lib/server/repositories/workspace-members';
import { WORKSPACE_STATUSES } from '$lib/shared/models/workspace';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import { parseWorkspaceSlugFromHost } from '$lib/shared/workspace-host';

export async function listUserWorkspaceContexts(userId: string): Promise<WorkspaceContext[]> {
	const memberships = await listWorkspaceMembersByUserId(userId);
	const contexts: WorkspaceContext[] = [];

	for (const membership of memberships) {
		const workspace = await findWorkspaceBySlugOrId(membership.workspaceId.toString());

		if (!workspace || workspace.status !== WORKSPACE_STATUSES.ACTIVE) {
			continue;
		}

		contexts.push({
			workspaceId: workspace._id.toString(),
			workspaceName: workspace.name,
			workspaceSlug: workspace.slug,
			role: membership.role,
			brandLogoUrl: workspace.brandLogoUrl?.trim() || null
		});
	}

	return contexts.sort((a, b) => a.workspaceName.localeCompare(b.workspaceName));
}

export function resolveActiveWorkspaceContext(
	workspaces: WorkspaceContext[],
	requestUrl: URL,
	hostSuffix: string
): WorkspaceContext | null {
	if (workspaces.length === 0) {
		return null;
	}

	const hostSlug = parseWorkspaceSlugFromHost(requestUrl.host, hostSuffix);

	if (hostSlug) {
		const match = workspaces.find((workspace) => workspace.workspaceSlug === hostSlug);

		if (match) {
			return match;
		}
	}

	return workspaces[0];
}
