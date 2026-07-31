import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import { findUserById } from '$lib/server/repositories/users';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?redirectTo=/admin/workspace-requests');
	}

	const user = await findUserById(locals.user.id);

	if (!user || !isSuperadminUser(user)) {
		error(403, 'Forbidden');
	}

	return {
		user: locals.user
	};
};
