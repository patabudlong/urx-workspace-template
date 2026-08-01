import { SignJWT, jwtVerify } from 'jose';
import type { AccessTokenPayload } from '$lib/server/auth/jwt';
import {
	getJwtSigningSecret,
	getJwtVerificationSecrets
} from '$lib/server/auth/session';
import { buildWorkspaceRequestUrl } from '$lib/server/workspace-host';

const ALGORITHM = 'HS256';
const ISSUER = 'urx-workspace';
const AUDIENCE = 'urx-api';
const SESSION_HANDOFF_TTL_SECONDS = 60;

function safeRedirectPath(value: string): string {
	if (!value.startsWith('/') || value.startsWith('//')) {
		return '/';
	}

	return value;
}

export async function signSessionHandoffToken(payload: AccessTokenPayload): Promise<string> {
	const secret = new TextEncoder().encode(getJwtSigningSecret());

	return new SignJWT({ email: payload.email, typ: 'session_handoff' })
		.setProtectedHeader({ alg: ALGORITHM })
		.setSubject(payload.sub)
		.setIssuedAt()
		.setIssuer(ISSUER)
		.setAudience(AUDIENCE)
		.setExpirationTime(`${SESSION_HANDOFF_TTL_SECONDS}s`)
		.sign(secret);
}

export async function verifySessionHandoffToken(token: string): Promise<AccessTokenPayload | null> {
	const secrets = getJwtVerificationSecrets();

	for (const secretValue of secrets) {
		try {
			const secret = new TextEncoder().encode(secretValue);
			const { payload } = await jwtVerify(token, secret, {
				issuer: ISSUER,
				audience: AUDIENCE
			});

			if (
				payload.typ !== 'session_handoff' ||
				!payload.sub ||
				typeof payload.email !== 'string'
			) {
				continue;
			}

			return {
				sub: payload.sub,
				email: payload.email
			};
		} catch {
			// Try next secret during rotation overlap.
		}
	}

	return null;
}

export function needsSessionHandoff(currentOrigin: string, targetUrl: string): boolean {
	try {
		return new URL(targetUrl).origin !== currentOrigin;
	} catch {
		return false;
	}
}

export function buildSessionHandoffUrl(
	slug: string,
	requestUrl: URL,
	token: string,
	redirectTo: string
): string {
	const handoff = new URL('/auth/session/handoff', buildWorkspaceRequestUrl(slug, requestUrl, '/'));
	handoff.searchParams.set('token', token);
	handoff.searchParams.set('redirectTo', safeRedirectPath(redirectTo));
	return handoff.toString();
}

export async function resolveCrossHostWorkspaceRedirect(
	user: AccessTokenPayload,
	slug: string,
	requestUrl: URL,
	path: string
): Promise<string> {
	const safePath = safeRedirectPath(path);
	const dashboardUrl = buildWorkspaceRequestUrl(slug, requestUrl, safePath);

	if (!needsSessionHandoff(requestUrl.origin, dashboardUrl)) {
		return safePath;
	}

	const token = await signSessionHandoffToken(user);
	return buildSessionHandoffUrl(slug, requestUrl, token, safePath);
}
