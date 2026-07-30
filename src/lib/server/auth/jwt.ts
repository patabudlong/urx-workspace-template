import { SignJWT, jwtVerify } from 'jose';
import {
	ACCESS_TOKEN_TTL_SECONDS,
	getJwtSigningSecret,
	getJwtVerificationSecrets
} from '$lib/server/auth/session';

const ALGORITHM = 'HS256';
const ISSUER = 'urx-workspace';
const AUDIENCE = 'urx-api';

export type AccessTokenPayload = {
	sub: string;
	email: string;
};

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
	const secret = new TextEncoder().encode(getJwtSigningSecret());

	return new SignJWT({ email: payload.email })
		.setProtectedHeader({ alg: ALGORITHM })
		.setSubject(payload.sub)
		.setIssuedAt()
		.setIssuer(ISSUER)
		.setAudience(AUDIENCE)
		.setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
		.sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
	const secrets = getJwtVerificationSecrets();

	for (const secretValue of secrets) {
		try {
			const secret = new TextEncoder().encode(secretValue);
			const { payload } = await jwtVerify(token, secret, {
				issuer: ISSUER,
				audience: AUDIENCE
			});

			if (!payload.sub || typeof payload.email !== 'string') {
				continue;
			}

			return {
				sub: payload.sub,
				email: payload.email
			};
		} catch {
			// Try next secret (e.g. JWT_SECRET_PREVIOUS during rotation)
		}
	}

	return null;
}
