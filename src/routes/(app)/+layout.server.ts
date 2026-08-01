import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import { PLATFORM_ADMIN_HOME } from '$lib/server/auth/post-auth-navigation';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { findUserById } from '$lib/server/repositories/users';
import { loadUserDisplay } from '$lib/server/user-display';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	const user = await findUserById(locals.user.id);

	if (user && isSuperadminUser(user)) {
		redirect(303, PLATFORM_ADMIN_HOME);
	}

	const access = await getOnboardingAccessState(locals.user.id);

	if (access.status !== 'ready' && url.pathname !== '/onboarding') {
		redirect(303, '/onboarding');
	}
	const userDisplay = await loadUserDisplay(locals.user.id, locals.user.email);

	return {
		user: locals.user,
		firstName: user?.firstName ?? '',
		workspace:
			access.status === 'ready'
				? {
						workspaceId: access.workspaceId,
						workspaceName: access.workspaceName,
						workspaceSlug: access.workspaceSlug,
						role: access.role
					}
				: null,
		userDisplay
	};
};
