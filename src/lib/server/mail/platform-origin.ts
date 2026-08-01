import { env } from '$env/dynamic/private';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';

export function resolvePlatformWorkspaceOrigin(requestOrigin: string): string {
	const configured = env.PLATFORM_WORKSPACE_ORIGIN?.trim();

	if (configured) {
		return configured.replace(/\/$/, '');
	}

	const requestUrl = new URL(requestOrigin);
	const suffix = getWorkspaceHostSuffix();
	const port = requestUrl.port ? `:${requestUrl.port}` : '';

	return `${requestUrl.protocol}//${suffix}${port}`;
}

export function buildPlatformWorkspaceUrl(requestOrigin: string, path = '/'): string {
	const base = resolvePlatformWorkspaceOrigin(requestOrigin);
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;

	return `${base}${normalizedPath}`;
}

/** Host label for email copy, e.g. workspace.urixoft.com */
export function formatPlatformWorkspaceHost(requestOrigin: string): string {
	return new URL(resolvePlatformWorkspaceOrigin(requestOrigin)).host;
}
