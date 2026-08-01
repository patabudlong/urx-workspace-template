export const PRIVATE_NO_STORE_CACHE_CONTROL = 'private, no-cache, no-store, must-revalidate';

export function applyPrivateNoStoreHeaders(headers: Headers): void {
	headers.set('Cache-Control', PRIVATE_NO_STORE_CACHE_CONTROL);
	headers.set('Pragma', 'no-cache');
	headers.set('Expires', '0');
}

export function isSensitiveHtmlRoute(routeId: string | null | undefined): boolean {
	if (!routeId) {
		return false;
	}

	return (
		routeId.startsWith('/(app)') ||
		routeId.startsWith('/(platform)') ||
		routeId.startsWith('/(onboarding)') ||
		routeId.startsWith('/(auth)')
	);
}
