import { redirect } from '@sveltejs/kit';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import { isWorkspaceOwner } from '$lib/navigation/app-nav';

export function requireWorkspaceMember(
	workspace: WorkspaceContext | null | undefined,
	redirectTo = '/'
): asserts workspace is WorkspaceContext {
	if (!workspace) {
		redirect(303, redirectTo);
	}
}

export function requireWorkspaceOwner(
	workspace: WorkspaceContext | null | undefined,
	redirectTo = '/'
): asserts workspace is WorkspaceContext {
	if (!workspace || !isWorkspaceOwner(workspace.role)) {
		redirect(303, redirectTo);
	}
}
