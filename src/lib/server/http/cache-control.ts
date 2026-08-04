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

function normalizePathname(pathname: string): string {
	if (pathname.length > 1 && pathname.endsWith('/')) {
		return pathname.slice(0, -1);
	}

	return pathname;
}

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

	// Trailing-slash normalize (308) can run with a null route id — still mark private.
	return pathname ? isSensitiveHtmlPath(pathname) : false;
}
