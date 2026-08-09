import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createGoogleAuthorizationUrl,
	generateCodeVerifier,
	generateOAuthState,
	getGoogleRedirectUri,
	GOOGLE_OAUTH_CONTEXT_COOKIE,
	GOOGLE_OAUTH_COOKIE_MAX_AGE,
	GOOGLE_OAUTH_REDIRECT_COOKIE,
	GOOGLE_OAUTH_STATE_COOKIE,
	GOOGLE_OAUTH_VERIFIER_COOKIE,
	isGoogleAuthConfigured
} from '$lib/server/auth/google-oauth';
import { shouldUseSecureSessionCookie } from '$lib/server/auth/session-cookie';
import { getPlatformAuthOrigin, getSessionCookieDomain } from '$lib/server/workspace-host';
import { CONSENT_CONTEXTS, type ConsentContext } from '$lib/shared/models/consent-event';

function safeRedirectPath(value: string | null): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return '/';
	}

	return value;
}

function parseConsentContext(value: string | null): ConsentContext {
	return value === CONSENT_CONTEXTS.SIGNUP ? CONSENT_CONTEXTS.SIGNUP : CONSENT_CONTEXTS.LOGIN;
}

function getOAuthCookieOptions() {
	const domain = getSessionCookieDomain();

	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: shouldUseSecureSessionCookie(),
		maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE,
		...(domain ? { domain } : {})
	};
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!isGoogleAuthConfigured()) {
		error(503, 'Google sign-in is not configured');
	}

	const platformOrigin = getPlatformAuthOrigin(url);

	if (url.origin !== platformOrigin) {
		redirect(302, `${platformOrigin}/auth/google${url.search}`);
	}

	const state = generateOAuthState();
	const codeVerifier = generateCodeVerifier();
	const redirectUri = getGoogleRedirectUri(platformOrigin);
	const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
	const context = parseConsentContext(url.searchParams.get('context'));
	const cookieOptions = getOAuthCookieOptions();

	cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
	cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);
	cookies.set(GOOGLE_OAUTH_REDIRECT_COOKIE, redirectTo, cookieOptions);
	cookies.set(GOOGLE_OAUTH_CONTEXT_COOKIE, context, cookieOptions);

	const authorizationUrl = createGoogleAuthorizationUrl({
		redirectUri,
		state,
		codeVerifier
	});

	redirect(302, authorizationUrl);
};
