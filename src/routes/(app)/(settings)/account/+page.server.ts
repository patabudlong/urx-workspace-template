import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { toUserProfile } from '$lib/server/auth/user-profile';
import { findUserById, updateUserProfile } from '$lib/server/repositories/users';
import { requireWorkspaceMember } from '$lib/server/workspace-access';
import {
	PROFILE_UPDATE_FAILED_MESSAGE,
	PROFILE_UPDATED_MESSAGE
} from '$lib/shared/account-messages';
import { updateProfileSchema } from '$lib/shared/schemas/account';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	const user = await findUserById(locals.user!.id);

	if (!user) {
		error(404, 'User not found');
	}

	const form = await superValidate(
		{
			firstName: user.firstName,
			lastName: user.lastName
		},
		zod4(updateProfileSchema)
	);

	return {
		profile: toUserProfile(user),
		form,
		meta: {
			title: 'Account'
		}
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(updateProfileSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const updated = await updateUserProfile(locals.user.id, form.data);

		if (!updated) {
			return message(form, PROFILE_UPDATE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PROFILE_UPDATED_MESSAGE);
	}
};
