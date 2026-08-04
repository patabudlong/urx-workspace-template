import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth/session-cookie';
import { safeRedirectPath } from '$lib/server/auth/post-auth-navigation';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import {
	getPlatformAuthOrigin,
	getSessionCookieDomain,
	getWorkspaceHostSuffix,
	listLocalSessionOrigins,
	parseWorkspaceSlugFromRequest
} from '$lib/server/workspace-host';
import { isLocalWorkspaceHostSuffix } from '$lib/shared/platform-auth-origin';
import { isValidWorkspaceSlug } from '$lib/shared/workspace-slug';

type CompleteLogoutOptions = {
	workspaceSlug?: string | null;
};

const LOGOUT_QUEUE_PARAM = 'logoutQueue';

function needsCrossHostLogoutChain(): boolean {
	if (getSessionCookieDomain()) {
		return false;
	}

	return isLocalWorkspaceHostSuffix(getWorkspaceHostSuffix());
}

function sanitizeWorkspaceSlug(value: string | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const slug = value.trim().toLowerCase();
	return isValidWorkspaceSlug(slug) ? slug : undefined;
}

function parseLogoutQueue(raw: string | null): string[] {
	if (!raw) {
		return [];
	}

	return raw
		.split(',')
		.map((part) => part.trim())
		.filter((part) => {
			try {
				return Boolean(new URL(part).origin);
			} catch {
				return false;
			}
		});
}

function resolveLogoutDestination(url: URL): string {
	const finalRedirect = url.searchParams.get('finalRedirect');

	if (finalRedirect !== null) {
		const safeFinal = safeRedirectPath(finalRedirect);
		return safeFinal !== '/' ? safeFinal : '/login?signedOut=1';
	}

	const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
	return redirectTo !== '/' ? redirectTo : '/login?signedOut=1';
}

export async function resolveLogoutWorkspaceSlug(
	url: URL,
	userId: string | undefined
): Promise<string | undefined> {
	const hostSlug = parseWorkspaceSlugFromRequest(url);

	if (hostSlug) {
		return hostSlug;
	}

	const querySlug = sanitizeWorkspaceSlug(url.searchParams.get('workspaceSlug'));

	if (querySlug) {
		return querySlug;
	}

	if (!userId) {
		return undefined;
	}

	const access = await getOnboardingAccessState(userId);

	if (access.status === 'ready' || access.status === 'pending_review') {
		return access.workspaceSlug;
	}

	return undefined;
}

/** Clears the current host session, then hops remaining local cookie hosts. */
export function completeLogout(
	cookies: Cookies,
	url: URL,
	options: CompleteLogoutOptions = {}
): never {
	clearSessionCookie(cookies);

	const destination = resolveLogoutDestination(url);
	const workspaceSlug =
		sanitizeWorkspaceSlug(options.workspaceSlug) ??
		sanitizeWorkspaceSlug(url.searchParams.get('workspaceSlug'));

	const queueParam = url.searchParams.get(LOGOUT_QUEUE_PARAM);
	const chained = queueParam !== null || url.searchParams.get('finalRedirect') !== null;
	let queue = parseLogoutQueue(queueParam);

	if (!chained && needsCrossHostLogoutChain()) {
		queue = listLocalSessionOrigins(url, workspaceSlug).filter(
			(origin) => origin !== url.origin
		);
	}

	const nextOrigin = queue.shift();

	if (nextOrigin) {
		const nextLogout = new URL('/logout', nextOrigin);
		nextLogout.searchParams.set(LOGOUT_QUEUE_PARAM, queue.join(','));
		nextLogout.searchParams.set('finalRedirect', destination);

		if (workspaceSlug) {
			nextLogout.searchParams.set('workspaceSlug', workspaceSlug);
		}

		redirect(303, nextLogout.toString());
	}

	const authOrigin = getPlatformAuthOrigin(url);

	if (url.origin !== authOrigin) {
		redirect(303, new URL(destination, authOrigin).toString());
	}

	redirect(303, destination);
}
