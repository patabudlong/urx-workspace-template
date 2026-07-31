import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { findUserById } from '$lib/server/repositories/users';
import { isSuperadminUser } from '$lib/server/auth/platform-admin';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/onboarding');
	}

	const access = await getOnboardingAccessState(locals.user.id);

	if (access.status === 'ready') {
		redirect(303, '/');
	}

	const user = await findUserById(locals.user.id);

	return {
		user: locals.user,
		access,
		isSuperadmin: user ? isSuperadminUser(user) : false
	};
};
