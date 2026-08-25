import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { toSecurityProfile } from '$lib/server/auth/security-profile';
import { findUserById } from '$lib/server/repositories/users';
import { requireWorkspaceMember } from '$lib/server/workspace-access';

export const load: LayoutServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	const user = await findUserById(locals.user!.id);

	if (!user) {
		error(404, 'User not found');
	}

	return {
		security: toSecurityProfile(user)
	};
};
