import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getSessionCookieDomain } from '$lib/server/workspace-host';

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

function buildSessionCookieOptions(maxAge: number): SessionCookieOptions {
	const domain = getSessionCookieDomain();

	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
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
	'path' | 'domain' | 'secure'
> {
	const { path, domain, secure } = getSessionCookieOptions();

	return {
		path,
		secure,
		...(domain ? { domain } : {})
	};
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, getSessionCookieDeleteOptions());
	// Clear legacy host-only cookies set before SESSION_COOKIE_DOMAIN was configured.
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
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
