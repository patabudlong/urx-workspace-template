import type { Cookies } from '@sveltejs/kit';
import { getSessionCookieDomain, getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { isLocalWorkspaceHostSuffix } from '$lib/shared/platform-auth-origin';

export const SESSION_COOKIE_NAME = 'urx_session';
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionCookieOptions = {
	path: string;
	httpOnly: boolean;
	sameSite: 'lax';
	secure: boolean;
	maxAge: number;
	domain?: string;
};

/**
 * SvelteKit defaults Secure=true except on exact `localhost`. Explicit false on
 * local `*.localhost` so HTTP set/clear target the same non-Secure cookie.
 */
export function shouldUseSecureSessionCookie(): boolean {
	if (isLocalWorkspaceHostSuffix(getWorkspaceHostSuffix())) {
		return false;
	}

	return process.env.NODE_ENV === 'production';
}

function buildSessionCookieOptions(maxAge: number): SessionCookieOptions {
	const domain = getSessionCookieDomain();

	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: shouldUseSecureSessionCookie(),
		maxAge,
		...(domain ? { domain } : {})
	};
}

export function getSessionCookieOptions(): SessionCookieOptions {
	return buildSessionCookieOptions(ACCESS_TOKEN_TTL_SECONDS);
}

/** Must match path/domain/secure used when the session cookie was set. */
export function getSessionCookieDeleteOptions(): Pick<
	SessionCookieOptions,
	'path' | 'domain' | 'secure' | 'httpOnly' | 'sameSite'
> {
	const { path, domain, secure, httpOnly, sameSite } = getSessionCookieOptions();

	return {
		path,
		httpOnly,
		sameSite,
		secure,
		...(domain ? { domain } : {})
	};
}

export function clearSessionCookie(cookies: Cookies): void {
	const deleteOptions = getSessionCookieDeleteOptions();

	// Kit keys cookies by domain+path+name; always pass explicit secure.
	cookies.delete(SESSION_COOKIE_NAME, deleteOptions);

	if (deleteOptions.domain) {
		cookies.delete(SESSION_COOKIE_NAME, {
			path: '/',
			httpOnly: deleteOptions.httpOnly,
			sameSite: deleteOptions.sameSite,
			secure: deleteOptions.secure
		});
	}
}
