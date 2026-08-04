import { env } from '$env/dynamic/private';
import {
	buildWorkspaceHostname,
	buildWorkspaceUrl,
	DEFAULT_WORKSPACE_HOST_SUFFIX,
	getWorkspaceHostSuffixFromEnv,
	parseWorkspaceSlugFromHost
} from '$lib/shared/workspace-host';
import { isLocalWorkspaceHostSuffix, resolveGoogleOAuthOrigin } from '$lib/shared/platform-auth-origin';

export function getWorkspaceHostSuffix(): string {
	return getWorkspaceHostSuffixFromEnv(env.WORKSPACE_HOST_SUFFIX, DEFAULT_WORKSPACE_HOST_SUFFIX);
}

export function getSessionCookieDomain(): string | undefined {
	const suffix = getWorkspaceHostSuffix();

	// Shared cookie domains on *.localhost are unreliable in browsers — use host-only cookies locally.
	if (isLocalWorkspaceHostSuffix(suffix)) {
		return undefined;
	}

	const domain = env.SESSION_COOKIE_DOMAIN?.trim();
	return domain || undefined;
}

export function resolveWorkspaceDashboardUrl(
	slug: string,
	requestUrl: URL,
	path = '/'
): string {
	const landing = resolveWorkspaceLandingUrl(slug, requestUrl, path);

	if (landing.startsWith('http')) {
		return landing;
	}

	return buildWorkspaceRequestUrl(slug, requestUrl, landing);
}

export function getPlatformAuthOrigin(requestUrl: URL): string {
	return resolveGoogleOAuthOrigin({
		configuredOrigin: env.GOOGLE_OAUTH_ORIGIN,
		hostname: requestUrl.hostname.toLowerCase(),
		workspaceHostSuffix: getWorkspaceHostSuffix(),
		protocol: requestUrl.protocol,
		port: requestUrl.port
	});
}

/** Brand / mail asset origin (`WORKSPACE_HOST_SUFFIX`), e.g. workspace.localhost. */
export function getPlatformWorkspaceOrigin(requestUrl: URL): string {
	const configured = env.PLATFORM_WORKSPACE_ORIGIN?.trim();

	if (configured) {
		return configured.replace(/\/$/, '');
	}

	const suffix = getWorkspaceHostSuffix();
	const port = requestUrl.port ? `:${requestUrl.port}` : '';

	return `${requestUrl.protocol}//${suffix}${port}`;
}

export function parseWorkspaceSlugFromRequest(url: URL): string | null {
	return parseWorkspaceSlugFromHost(url.host, getWorkspaceHostSuffix());
}

export function buildWorkspaceRequestUrl(slug: string, requestUrl: URL, path = '/'): string {
	return buildWorkspaceUrl(slug, {
		suffix: getWorkspaceHostSuffix(),
		protocol: requestUrl.protocol,
		port: requestUrl.port,
		path
	});
}

export function resolveWorkspaceLandingUrl(
	slug: string,
	requestUrl: URL,
	path: string
): string {
	const currentSlug = parseWorkspaceSlugFromRequest(requestUrl);

	if (currentSlug === slug) {
		return path;
	}

	return buildWorkspaceRequestUrl(slug, requestUrl, path);
}

/**
 * Distinct local hosts that may hold a host-only session cookie when
 * SESSION_COOKIE_DOMAIN is unset (auth, mail/platform, optional tenant).
 */
export function listLocalSessionOrigins(
	requestUrl: URL,
	workspaceSlug?: string | null
): string[] {
	const origins = new Set<string>();

	origins.add(getPlatformAuthOrigin(requestUrl));
	origins.add(getPlatformWorkspaceOrigin(requestUrl));

	if (workspaceSlug) {
		try {
			origins.add(new URL(buildWorkspaceRequestUrl(workspaceSlug, requestUrl, '/')).origin);
		} catch {
			// ignore invalid slug URL
		}
	}

	return [...origins];
}
