import {
	getPlatformAuthOrigin,
	getPlatformWorkspaceOrigin
} from '$lib/server/workspace-host';

export function resolvePlatformWorkspaceOrigin(requestOrigin: string): string {
	return getPlatformWorkspaceOrigin(new URL(requestOrigin));
}

/** Sign-in origin for email CTAs — must match GOOGLE_OAUTH_ORIGIN / logout clearing. */
export function resolvePlatformAuthOrigin(requestOrigin: string): string {
	return getPlatformAuthOrigin(new URL(requestOrigin));
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
