import type { RequestEvent } from '@sveltejs/kit';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';

export async function resolveWorkspaceIdFromRequest(
	event: Pick<RequestEvent, 'locals' | 'url'>
): Promise<string | undefined> {
	if (!event.locals.user?.id) {
		return undefined;
	}

	const workspaces = await listUserWorkspaceContexts(event.locals.user.id);
	const workspace = resolveActiveWorkspaceContext(workspaces, event.url, getWorkspaceHostSuffix());

	return workspace?.workspaceId;
}

export async function resolveWorkspaceIdBySlug(
	userId: string,
	url: URL
): Promise<string | undefined> {
	const workspaces = await listUserWorkspaceContexts(userId);
	const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

	return workspace?.workspaceId;
}
