import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth/session';
import { safeRedirectPath } from '$lib/server/auth/post-auth-navigation';
import { getPlatformAuthOrigin } from '$lib/server/workspace-host';

/**
 * Clears the session on the current host, then chains through the platform auth
 * origin so host-only cookies on localhost are also removed in local dev.
 */
export function completeLogout(cookies: Cookies, url: URL): never {
	clearSessionCookie(cookies);

	const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
	const destination = redirectTo !== '/' ? redirectTo : '/login?signedOut=1';

	const platformOrigin = getPlatformAuthOrigin(url);

	if (url.origin !== platformOrigin) {
		const platformLogout = new URL('/logout', platformOrigin);

		if (redirectTo !== '/') {
			platformLogout.searchParams.set('redirectTo', redirectTo);
		}

		redirect(303, platformLogout.toString());
	}

	redirect(303, destination);
}
