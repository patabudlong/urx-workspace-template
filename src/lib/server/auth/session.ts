import { env } from '$env/dynamic/private';

export {
	ACCESS_TOKEN_TTL_SECONDS,
	SESSION_COOKIE_NAME,
	clearSessionCookie,
	getSessionCookieDeleteOptions,
	getSessionCookieOptions,
	shouldUseSecureSessionCookie
} from '$lib/server/auth/session-cookie';

export const TWO_FACTOR_PENDING_TTL_SECONDS = 60 * 10; // 10 minutes
export const MIN_JWT_SECRET_LENGTH = 32;

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
