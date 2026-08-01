import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signAccessToken } from '$lib/server/auth/jwt';
import { safeRedirectPath } from '$lib/server/auth/post-auth-navigation';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import {
	resolveCrossHostWorkspaceRedirect,
	verifySessionHandoffToken
} from '$lib/server/auth/session-handoff';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '$lib/server/auth/session';
import { parseWorkspaceSlugFromRequest } from '$lib/server/workspace-host';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = url.searchParams.get('token');
	const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));

	if (!token) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	const payload = await verifySessionHandoffToken(token);

	if (!payload) {
		redirect(303, `/login?error=session_handoff_expired&redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	const access = await getOnboardingAccessState(payload.sub);

	if (access.status !== 'ready') {
		redirect(303, '/onboarding');
	}

	const hostSlug = parseWorkspaceSlugFromRequest(url);

	if (hostSlug && hostSlug !== access.workspaceSlug) {
		redirect(
			303,
			await resolveCrossHostWorkspaceRedirect(payload, access.workspaceSlug, url, redirectTo)
		);
	}

	cookies.set(
		SESSION_COOKIE_NAME,
		await signAccessToken({ sub: payload.sub, email: payload.email }),
		getSessionCookieOptions()
	);

	redirect(303, redirectTo);
};
