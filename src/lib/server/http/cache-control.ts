import { normalizePathname } from '$lib/shared/url-path';

export const PRIVATE_NO_STORE_CACHE_CONTROL = 'private, no-cache, no-store, must-revalidate';

export function applyPrivateNoStoreHeaders(headers: Headers): void {
	headers.set('Cache-Control', PRIVATE_NO_STORE_CACHE_CONTROL);
	headers.set('Pragma', 'no-cache');
	headers.set('Expires', '0');
}

const SENSITIVE_PATH_PREFIXES = [
	'/account',
	'/security',
	'/billing',
	'/team',
	'/onboarding',
	'/admin',
	'/login',
	'/logout',
	'/signup',
	'/verify',
	'/forgot-password',
	'/reset-password',
	'/accept-invitation',
	'/auth'
] as const;

export function isSensitiveHtmlPath(pathname: string): boolean {
	const path = normalizePathname(pathname);

	return SENSITIVE_PATH_PREFIXES.some(
		(prefix) => path === prefix || path.startsWith(`${prefix}/`)
	);
}

export function isSensitiveHtmlRoute(
	routeId: string | null | undefined,
	pathname?: string
): boolean {
	if (
		routeId?.startsWith('/(app)') ||
		routeId?.startsWith('/(platform)') ||
		routeId?.startsWith('/(onboarding)') ||
		routeId?.startsWith('/(auth)')
	) {
		return true;
	}

	return pathname ? isSensitiveHtmlPath(pathname) : false;
}
