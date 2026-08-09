export const DEFAULT_WORKSPACE_HOST_SUFFIX = 'workspace.urixoft.com';

export function parseWorkspaceSlugFromHost(
	host: string,
	suffix = DEFAULT_WORKSPACE_HOST_SUFFIX
): string | null {
	const hostname = host.split(':')[0].toLowerCase();
	const normalizedSuffix = suffix.trim().toLowerCase();

	if (!hostname.endsWith(`.${normalizedSuffix}`)) {
		return null;
	}

	const slug = hostname.slice(0, -(normalizedSuffix.length + 1));

	if (!slug || slug.includes('.')) {
		return null;
	}

	return slug;
}

export function buildWorkspaceHostname(slug: string, suffix = DEFAULT_WORKSPACE_HOST_SUFFIX): string {
	return `${slug}.${suffix.trim()}`;
}

export function buildWorkspaceUrl(
	slug: string,
	options: {
		suffix?: string;
		protocol?: string;
		port?: string;
		path?: string;
	} = {}
): string {
	const suffix = options.suffix ?? DEFAULT_WORKSPACE_HOST_SUFFIX;
	const protocol = options.protocol ?? 'https:';
	const path = options.path ?? '/';
	const port = options.port ? `:${options.port}` : '';

	return `${protocol}//${buildWorkspaceHostname(slug, suffix)}${port}${path}`;
}

export function getWorkspaceHostSuffixFromEnv(
	envValue: string | undefined,
	fallback = DEFAULT_WORKSPACE_HOST_SUFFIX
): string {
	const value = envValue?.trim();
	return value || fallback;
}
