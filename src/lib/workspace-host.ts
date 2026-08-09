import { browser } from '$app/environment';
import {
	buildWorkspaceUrl,
	DEFAULT_WORKSPACE_HOST_SUFFIX,
	getWorkspaceHostSuffixFromEnv
} from '$lib/shared/workspace-host';

export function getPublicWorkspaceHostSuffix(): string {
	return getWorkspaceHostSuffixFromEnv(
		import.meta.env.PUBLIC_WORKSPACE_HOST_SUFFIX,
		DEFAULT_WORKSPACE_HOST_SUFFIX
	);
}

export function buildWorkspaceUrlFromWindow(slug: string, path = '/'): string {
	if (!browser) {
		return path;
	}

	return buildWorkspaceUrl(slug, {
		suffix: getPublicWorkspaceHostSuffix(),
		protocol: window.location.protocol,
		port: window.location.port,
		path
	});
}
