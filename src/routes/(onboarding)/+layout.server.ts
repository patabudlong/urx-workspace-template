import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { findUserById } from '$lib/server/repositories/users';
import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import { buildUserDisplay } from '$lib/shared/user-display';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/onboarding');
	}

	const access = await getOnboardingAccessState(locals.user.id);

	if (access.status === 'ready') {
		redirect(303, '/');
	}

	const user = await findUserById(locals.user.id);
	const userDisplay = buildUserDisplay({
		email: user?.email ?? locals.user.email,
		firstName: user?.firstName,
		lastName: user?.lastName,
		avatarUrl: user?.avatarUrl
	});

	return {
		user: locals.user,
		access,
		isSuperadmin: user ? isSuperadminUser(user) : false,
		userDisplay
	};
};
