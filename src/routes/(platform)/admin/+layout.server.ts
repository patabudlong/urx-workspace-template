import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import { findUserById } from '$lib/server/repositories/users';
import { buildUserDisplay } from '$lib/shared/user-display';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/admin/workspace-requests');
	}

	const user = await findUserById(locals.user.id);

	if (!user || !isSuperadminUser(user)) {
		error(403, 'You need platform admin access to view this page.');
	}

	return {
		user: locals.user,
		userDisplay: buildUserDisplay({
			email: user.email ?? locals.user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			avatarUrl: user.avatarUrl
		})
	};
};
