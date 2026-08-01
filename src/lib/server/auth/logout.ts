import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth/session';
import { getPlatformAuthOrigin } from '$lib/server/workspace-host';

/**
 * Clears the session on the current host, then chains through the platform auth
 * origin so host-only cookies on localhost are also removed in local dev.
 */
export function completeLogout(cookies: Cookies, url: URL): never {
	clearSessionCookie(cookies);

	const platformOrigin = getPlatformAuthOrigin(url);

	if (url.origin !== platformOrigin) {
		redirect(303, `${platformOrigin}/logout`);
	}

	redirect(303, '/login?signedOut=1');
}
