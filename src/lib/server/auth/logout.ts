import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth/session';
import { safeRedirectPath } from '$lib/server/auth/post-auth-navigation';
import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import {
	buildWorkspaceRequestUrl,
	getPlatformAuthOrigin,
	getSessionCookieDomain,
	getWorkspaceHostSuffix
} from '$lib/server/workspace-host';
import { isLocalWorkspaceHostSuffix } from '$lib/shared/platform-auth-origin';

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

	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		return undefined;
	}

	return slug;
}

function originFromUrlString(value: string): string | null {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

function parseLogoutQueue(raw: string | null): string[] {
	if (!raw) {
		return [];
	}

	return raw
		.split(',')
		.map((part) => part.trim())
		.map((part) => originFromUrlString(part))
		.filter((origin): origin is string => Boolean(origin));
}

function encodeLogoutQueue(origins: string[]): string {
	// URLSearchParams encodes the value; origins never contain commas.
	return origins.join(',');
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

/**
 * Hosts that can hold a host-only session cookie in local dev:
 * - auth origin (GOOGLE_OAUTH_ORIGIN → localhost)
 * - platform workspace origin (WORKSPACE_HOST_SUFFIX → workspace.localhost) used by email links
 * - tenant workspace host ({slug}.workspace.localhost)
 */
function buildLocalLogoutQueue(url: URL, workspaceSlug: string | undefined): string[] {
	const authOrigin = getPlatformAuthOrigin(url);
	const mailOrigin = resolvePlatformWorkspaceOrigin(url.origin);
	const queued = new Set<string>();

	queued.add(authOrigin);

	if (mailOrigin !== authOrigin) {
		queued.add(mailOrigin);
	}

	if (workspaceSlug) {
		const tenantOrigin = originFromUrlString(buildWorkspaceRequestUrl(workspaceSlug, url, '/'));

		if (tenantOrigin) {
			queued.add(tenantOrigin);
		}
	}

	queued.delete(url.origin);

	return [...queued];
}

/**
 * Clears the session on the current host, then chains across local auth / mail / tenant
 * origins so host-only cookies on *.localhost are removed.
 */
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
		queue = buildLocalLogoutQueue(url, workspaceSlug);
	}

	const nextOrigin = queue.shift();

	if (nextOrigin) {
		const nextLogout = new URL('/logout', nextOrigin);
		nextLogout.searchParams.set(LOGOUT_QUEUE_PARAM, encodeLogoutQueue(queue));
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
