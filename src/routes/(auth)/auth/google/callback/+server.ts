import { isRedirect, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateWithGoogle } from '$lib/server/auth/google';
import { resolveAuthenticatedLandingPath } from '$lib/server/auth/post-auth-navigation';
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
import {
	getTwoFactorPendingCookieOptions,
	TWO_FACTOR_PENDING_COOKIE_NAME
} from '$lib/server/auth/two-factor/challenge';
import { getPlatformAuthOrigin, getSessionCookieDomain } from '$lib/server/workspace-host';
import { CONSENT_CONTEXTS, type ConsentContext } from '$lib/shared/models/consent-event';

function safeRedirectPath(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return '/';
	}

	return value;
}

function clearOAuthCookies(cookies: import('@sveltejs/kit').Cookies): void {
	const domain = getSessionCookieDomain();
	const options = {
		path: '/',
		...(domain ? { domain } : {})
	};

	cookies.delete(GOOGLE_OAUTH_STATE_COOKIE, options);
	cookies.delete(GOOGLE_OAUTH_VERIFIER_COOKIE, options);
	cookies.delete(GOOGLE_OAUTH_REDIRECT_COOKIE, options);
	cookies.delete(GOOGLE_OAUTH_CONTEXT_COOKIE, options);
	cookies.delete(GOOGLE_OAUTH_STATE_COOKIE, { path: '/' });
	cookies.delete(GOOGLE_OAUTH_VERIFIER_COOKIE, { path: '/' });
	cookies.delete(GOOGLE_OAUTH_REDIRECT_COOKIE, { path: '/' });
	cookies.delete(GOOGLE_OAUTH_CONTEXT_COOKIE, { path: '/' });
}

function authErrorRedirect(context: ConsentContext, code: string): never {
	const returnPath = context === CONSENT_CONTEXTS.SIGNUP ? '/signup' : '/login';

	redirect(303, `${returnPath}?error=${encodeURIComponent(code)}`);
}

export const GET: RequestHandler = async ({ url, cookies }) => {
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
		const platformOrigin = getPlatformAuthOrigin(url);
		const accessToken = await exchangeGoogleAuthorizationCode({
			code,
			redirectUri: getGoogleRedirectUri(platformOrigin),
			codeVerifier
		});
		const profile = await fetchGoogleProfile(accessToken);
		const result = await authenticateWithGoogle(profile, cookies);

		if (!result.ok) {
			if (result.reason === 'AUTH_NOT_CONFIGURED') {
				authErrorRedirect(context, 'auth_not_configured');
			}

			authErrorRedirect(context, 'google_account_conflict');
		}

		if ('twoFactorRequired' in result && result.twoFactorRequired) {
			cookies.set(
				TWO_FACTOR_PENDING_COOKIE_NAME,
				result.pendingToken,
				getTwoFactorPendingCookieOptions()
			);

			const twoFactorUrl =
				redirectTo === '/'
					? '/login/2fa'
					: `/login/2fa?redirectTo=${encodeURIComponent(redirectTo)}`;

			redirect(303, twoFactorUrl);
		}

		const session = result as typeof result & {
			accessToken: string;
			user: { id: string };
		};
		cookies.set(SESSION_COOKIE_NAME, session.accessToken, getSessionCookieOptions());

		redirect(
			303,
			await resolveAuthenticatedLandingPath(session.user.id, {
				requestedPath: redirectTo,
				requestUrl: url
			})
		);
	} catch (error) {
		if (isRedirect(error)) {
			throw error;
		}

		authErrorRedirect(context, 'google_auth_failed');
	}
};
