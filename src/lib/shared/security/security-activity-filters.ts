import {
	SECURITY_EVENT_CATEGORIES,
	type SecurityEventCategory
} from '$lib/shared/models/security-event';

export const WORKSPACE_SECURITY_FILTER_CATEGORIES = [
	SECURITY_EVENT_CATEGORIES.AUTH,
	SECURITY_EVENT_CATEGORIES.WORKSPACE,
	SECURITY_EVENT_CATEGORIES.PLATFORM
] as const satisfies readonly SecurityEventCategory[];

type WorkspaceSecurityFilterCategory = (typeof WORKSPACE_SECURITY_FILTER_CATEGORIES)[number];

export function parseWorkspaceSecurityCategory(
	value: string | null
): SecurityEventCategory | undefined {
	if (!value) {
		return undefined;
	}

	return WORKSPACE_SECURITY_FILTER_CATEGORIES.includes(value as WorkspaceSecurityFilterCategory)
		? (value as SecurityEventCategory)
		: undefined;
}

export function buildSecurityLogHref(
	basePath: string,
	options: {
		page?: number;
		category?: SecurityEventCategory | null;
		unusualOnly?: boolean;
	} = {}
): string {
	const params = new URLSearchParams();

	if (options.page && options.page > 1) {
		params.set('page', String(options.page));
	}

	if (options.category) {
		params.set('category', options.category);
	}

	if (options.unusualOnly) {
		params.set('unusual', 'true');
	}

	const query = params.toString();
	return query ? `${basePath}?${query}` : basePath;
}
