import { env } from '$env/dynamic/private';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { resolveGoogleOAuthOrigin } from '$lib/shared/platform-auth-origin';

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

/**
 * Sign-in origin for email CTAs. Must match GOOGLE_OAUTH_ORIGIN / logout clearing
 * (localhost in local dev) — not WORKSPACE_HOST_SUFFIX (workspace.localhost), which is a
 * separate cookie jar and was leaving sessions alive after sign-out.
 */
export function resolvePlatformAuthOrigin(requestOrigin: string): string {
	const requestUrl = new URL(requestOrigin);

	return resolveGoogleOAuthOrigin({
		configuredOrigin: env.GOOGLE_OAUTH_ORIGIN,
		hostname: requestUrl.hostname.toLowerCase(),
		workspaceHostSuffix: getWorkspaceHostSuffix(),
		protocol: requestUrl.protocol,
		port: requestUrl.port
	});
}

export function buildPlatformWorkspaceUrl(requestOrigin: string, path = '/'): string {
	const base = resolvePlatformWorkspaceOrigin(requestOrigin);
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;

	return `${base}${normalizedPath}`;
}

/** Deep link into an authenticated app route via sign-in (safe for transactional email CTAs). */
export function buildAuthenticatedAppPathUrl(requestOrigin: string, path: string): string {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const loginPath = `/login?redirectTo=${encodeURIComponent(normalizedPath)}`;
	const base = resolvePlatformAuthOrigin(requestOrigin);

	return `${base}${loginPath}`;
}

/** Host label for email copy, e.g. workspace.urixoft.com */
export function formatPlatformWorkspaceHost(requestOrigin: string): string {
	return new URL(resolvePlatformWorkspaceOrigin(requestOrigin)).host;
}
