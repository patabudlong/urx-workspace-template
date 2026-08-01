import { env } from '$env/dynamic/private';
import {
	buildWorkspaceHostname,
	buildWorkspaceUrl,
	DEFAULT_WORKSPACE_HOST_SUFFIX,
	getWorkspaceHostSuffixFromEnv,
	parseWorkspaceSlugFromHost
} from '$lib/shared/workspace-host';

export function getWorkspaceHostSuffix(): string {
	return getWorkspaceHostSuffixFromEnv(env.WORKSPACE_HOST_SUFFIX, DEFAULT_WORKSPACE_HOST_SUFFIX);
}

export function getSessionCookieDomain(): string | undefined {
	const domain = env.SESSION_COOKIE_DOMAIN?.trim();
	return domain || undefined;
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
