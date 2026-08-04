import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getSessionCookieDomain, getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { isLocalWorkspaceHostSuffix } from '$lib/shared/platform-auth-origin';

export const SESSION_COOKIE_NAME = 'urx_session';
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const TWO_FACTOR_PENDING_TTL_SECONDS = 60 * 10; // 10 minutes
export const MIN_JWT_SECRET_LENGTH = 32;

type SessionCookieOptions = {
	path: string;
	httpOnly: boolean;
	sameSite: 'lax';
	secure: boolean;
	maxAge: number;
	domain?: string;
};

/**
 * SvelteKit defaults `secure: true` for any host other than exact `localhost`.
 * On `http://*.workspace.localhost` that would mint Secure cookies the browser
 * ignores over HTTP — and a Secure Max-Age=0 delete would not clear the real
 * non-Secure session cookie. Always set Secure explicitly for local HTTP hosts.
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

/** Must match path/domain (and secure) used when the session cookie was set. */
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

	// SvelteKit keys cookies by domain+path+name only — later deletes overwrite earlier
	// ones. Always pass explicit `secure` so *.localhost HTTP does not inherit Kit's
	// Secure=true default and fail to clear the real session cookie.
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

function isValidJwtSecret(secret: string | undefined): boolean {
	return Boolean(secret && secret.length >= MIN_JWT_SECRET_LENGTH);
}

/** Secret used to sign new JWTs (always the current key). */
export function getJwtSigningSecret(): string {
	const secret = env.JWT_SECRET;

	if (!isValidJwtSecret(secret)) {
		throw new Error(`JWT_SECRET must be set and at least ${MIN_JWT_SECRET_LENGTH} characters`);
	}

	return secret;
}

/**
 * Secrets used to verify JWTs during rotation overlap.
 * Order: current first, then previous (if set).
 */
export function getJwtVerificationSecrets(): string[] {
	const current = env.JWT_SECRET;
	const previous = env.JWT_SECRET_PREVIOUS;
	const secrets: string[] = [];

	if (isValidJwtSecret(current)) {
		secrets.push(current);
	}

	if (previous && isValidJwtSecret(previous) && previous !== current) {
		secrets.push(previous);
	}

	if (secrets.length === 0) {
		throw new Error(`JWT_SECRET must be set and at least ${MIN_JWT_SECRET_LENGTH} characters`);
	}

	return secrets;
}

/** @deprecated Use getJwtSigningSecret */
export function getJwtSecret(): string {
	return getJwtSigningSecret();
}
