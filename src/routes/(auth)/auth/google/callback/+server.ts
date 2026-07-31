import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateWithGoogle } from '$lib/server/auth/google';
import {
	exchangeGoogleAuthorizationCode,
	fetchGoogleProfile,
	getGoogleRedirectUri,
	GOOGLE_OAUTH_CONTEXT_COOKIE,
	GOOGLE_OAUTH_REDIRECT_COOKIE,
	GOOGLE_OAUTH_STATE_COOKIE,
	GOOGLE_OAUTH_VERIFIER_COOKIE,
	isGoogleAuthConfigured
} from '$lib/server/auth/google-oauth';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '$lib/server/auth/session';
import { recordConsentEvent } from '$lib/server/repositories/consent-events';
import { LEGAL_POLICY_VERSION } from '$lib/shared/legal';
import {
	CONSENT_CONTEXTS,
	CONSENT_EVENT_TYPES,
	type ConsentContext
} from '$lib/shared/models/consent-event';

function safeRedirectPath(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return '/';
	}

	return value;
}

function clearOAuthCookies(cookies: import('@sveltejs/kit').Cookies): void {
	const options = { path: '/' };

	cookies.delete(GOOGLE_OAUTH_STATE_COOKIE, options);
	cookies.delete(GOOGLE_OAUTH_VERIFIER_COOKIE, options);
	cookies.delete(GOOGLE_OAUTH_REDIRECT_COOKIE, options);
	cookies.delete(GOOGLE_OAUTH_CONTEXT_COOKIE, options);
}

function authErrorRedirect(context: ConsentContext, code: string): never {
	const returnPath = context === CONSENT_CONTEXTS.SIGNUP ? '/signup' : '/login';

	redirect(303, `${returnPath}?error=${encodeURIComponent(code)}`);
}

export const GET: RequestHandler = async ({ url, cookies, getClientAddress, request }) => {
	const context =
		cookies.get(GOOGLE_OAUTH_CONTEXT_COOKIE) === CONSENT_CONTEXTS.SIGNUP
			? CONSENT_CONTEXTS.SIGNUP
			: CONSENT_CONTEXTS.LOGIN;
	const redirectTo = safeRedirectPath(cookies.get(GOOGLE_OAUTH_REDIRECT_COOKIE));
	const storedState = cookies.get(GOOGLE_OAUTH_STATE_COOKIE);
	const codeVerifier = cookies.get(GOOGLE_OAUTH_VERIFIER_COOKIE);

	clearOAuthCookies(cookies);

	if (!isGoogleAuthConfigured()) {
		authErrorRedirect(context, 'google_not_configured');
	}

	const oauthError = url.searchParams.get('error');

	if (oauthError) {
		authErrorRedirect(context, oauthError === 'access_denied' ? 'google_cancelled' : 'google_auth_failed');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		authErrorRedirect(context, 'google_auth_failed');
	}

	try {
		const accessToken = await exchangeGoogleAuthorizationCode({
			code,
			redirectUri: getGoogleRedirectUri(url.origin),
			codeVerifier
		});
		const profile = await fetchGoogleProfile(accessToken);
		const result = await authenticateWithGoogle(profile);

		if (!result.ok) {
			if (result.reason === 'AUTH_NOT_CONFIGURED') {
				authErrorRedirect(context, 'auth_not_configured');
			}

			authErrorRedirect(context, 'google_account_conflict');
		}

		const ipAddress = getClientAddress();

		await recordConsentEvent({
			type: CONSENT_EVENT_TYPES.SOCIAL_LOGIN_GOOGLE,
			context,
			ipAddress,
			userAgent: request.headers.get('user-agent') ?? undefined,
			email: result.user.email,
			userId: result.user.id,
			policyVersion: LEGAL_POLICY_VERSION
		});

		cookies.set(SESSION_COOKIE_NAME, result.accessToken, getSessionCookieOptions());

		redirect(303, redirectTo);
	} catch {
		authErrorRedirect(context, 'google_auth_failed');
	}
};
