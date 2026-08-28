import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import { PLATFORM_ADMIN_HOME } from '$lib/server/auth/post-auth-navigation';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { resolveCrossHostWorkspaceRedirect } from '$lib/server/auth/session-handoff';
import {
	getWorkspaceHostSuffix,
	resolveWorkspaceLandingUrl
} from '$lib/server/workspace-host';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { resolveUserPresenceStatus } from '$lib/server/presence';
import { findUserById } from '$lib/server/repositories/users';
import { buildUserDisplay } from '$lib/shared/user-display';

export const load: LayoutServerLoad = async ({ locals, url, untrack, depends }) => {
	depends('app:shell');

	if (!locals.user) {
		const redirectTo = untrack(() => encodeURIComponent(url.pathname + url.search));
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	// Workspace is host-scoped — never read `url` outside `untrack` or this layout
	// re-runs its Mongo queries on every client-side navigation.
	const requestUrl = untrack(() => new URL(url.href));

	const [user, access] = await Promise.all([
		findUserById(locals.user.id),
		getOnboardingAccessState(locals.user.id)
	]);

	if (user && isSuperadminUser(user)) {
		redirect(303, PLATFORM_ADMIN_HOME);
	}

	if (access.status !== 'ready' && requestUrl.pathname !== '/onboarding') {
		redirect(303, '/onboarding');
	}

	const workspaceHostSuffix = getWorkspaceHostSuffix();
	const workspaces =
		access.status === 'ready' ? await listUserWorkspaceContexts(locals.user.id) : [];
	const workspace =
		access.status === 'ready'
			? resolveActiveWorkspaceContext(workspaces, requestUrl, workspaceHostSuffix)
			: null;

	if (access.status === 'ready' && workspace) {
		const path = requestUrl.pathname + requestUrl.search;
		const landing = resolveWorkspaceLandingUrl(workspace.workspaceSlug, requestUrl, path);

		if (landing.startsWith('http')) {
			redirect(
				303,
				await resolveCrossHostWorkspaceRedirect(
					{ sub: locals.user.id, email: locals.user.email },
					workspace.workspaceSlug,
					requestUrl,
					path
				)
			);
		}
	}

	const userDisplay = buildUserDisplay({
		email: user?.email ?? locals.user.email,
		firstName: user?.firstName,
		lastName: user?.lastName,
		avatarUrl: user?.avatarUrl,
		presenceStatus: user ? resolveUserPresenceStatus(user) : 'offline'
	});

	return {
		user: locals.user,
		firstName: user?.firstName ?? '',
		workspace,
		workspaces,
		workspaceHostSuffix,
		userDisplay
	};
};
