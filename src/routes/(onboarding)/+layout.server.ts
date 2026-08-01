import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import { PLATFORM_ADMIN_HOME } from '$lib/server/auth/post-auth-navigation';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { buildWorkspaceRequestUrl, resolveWorkspaceLandingUrl } from '$lib/server/workspace-host';
import { findUserById } from '$lib/server/repositories/users';
import { buildUserDisplay } from '$lib/shared/user-display';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/onboarding');
	}

	const user = await findUserById(locals.user.id);

	if (user && isSuperadminUser(user)) {
		redirect(303, PLATFORM_ADMIN_HOME);
	}

	const access = await getOnboardingAccessState(locals.user.id);

	if (access.status === 'ready') {
		redirect(303, buildWorkspaceRequestUrl(access.workspaceSlug, url));
	}

	const userDisplay = buildUserDisplay({
		email: user?.email ?? locals.user.email,
		firstName: user?.firstName,
		lastName: user?.lastName,
		avatarUrl: user?.avatarUrl
	});

	return {
		user: locals.user,
		access,
		isSuperadmin: false,
		userDisplay
	};
};
