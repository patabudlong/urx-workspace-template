import { createHash, randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

export const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_state';
export const GOOGLE_OAUTH_VERIFIER_COOKIE = 'google_oauth_code_verifier';
export const GOOGLE_OAUTH_REDIRECT_COOKIE = 'google_oauth_redirect';
export const GOOGLE_OAUTH_CONTEXT_COOKIE = 'google_oauth_context';
export const GOOGLE_OAUTH_COOKIE_MAX_AGE = 60 * 10;

export type GoogleProfile = {
	sub: string;
	email: string;
	givenName: string;
	familyName: string;
	emailVerified: boolean;
	pictureUrl?: string;
};

export function isGoogleAuthConfigured(): boolean {
	return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
}

export function getGoogleRedirectUri(origin: string): string {
	return `${origin.replace(/\/$/, '')}/auth/google/callback`;
}

export function generateOAuthState(): string {
	return randomBytes(32).toString('base64url');
}

export function generateCodeVerifier(): string {
	return randomBytes(32).toString('base64url');
}

export function createCodeChallenge(verifier: string): string {
	return createHash('sha256').update(verifier).digest('base64url');
}

export function createGoogleAuthorizationUrl(input: {
	redirectUri: string;
	state: string;
	codeVerifier: string;
}): string {
	const clientId = env.GOOGLE_CLIENT_ID?.trim();

	if (!clientId) {
		throw new Error('GOOGLE_CLIENT_ID is not configured');
	}

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: input.redirectUri,
		response_type: 'code',
		scope: GOOGLE_SCOPES.join(' '),
		state: input.state,
		code_challenge: createCodeChallenge(input.codeVerifier),
		code_challenge_method: 'S256',
		prompt: 'select_account'
	});

	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthorizationCode(input: {
	code: string;
	redirectUri: string;
	codeVerifier: string;
}): Promise<string> {
	const clientId = env.GOOGLE_CLIENT_ID?.trim();
	const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();

	if (!clientId || !clientSecret) {
		throw new Error('Google OAuth is not configured');
	}

	const response = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code: input.code,
			redirect_uri: input.redirectUri,
			grant_type: 'authorization_code',
			code_verifier: input.codeVerifier
		})
	});

	const payload = (await response.json()) as {
		access_token?: string;
		error?: string;
		error_description?: string;
	};

	if (!response.ok || !payload.access_token) {
		throw new Error(payload.error_description ?? payload.error ?? 'Failed to exchange Google authorization code');
	}

	return payload.access_token;
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
	const response = await fetch(GOOGLE_USERINFO_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	const payload = (await response.json()) as {
		sub?: string;
		email?: string;
		given_name?: string;
		family_name?: string;
		email_verified?: boolean;
		picture?: string;
		error?: string;
	};

	if (!response.ok || !payload.sub || !payload.email) {
		throw new Error(payload.error ?? 'Failed to fetch Google profile');
	}

	if (!payload.email_verified) {
		throw new Error('Google account email is not verified');
	}

	return {
		sub: payload.sub,
		email: payload.email.trim().toLowerCase(),
		givenName: payload.given_name?.trim() || 'Google',
		familyName: payload.family_name?.trim() || 'User',
		emailVerified: true,
		pictureUrl: payload.picture?.trim() || undefined
	};
}
