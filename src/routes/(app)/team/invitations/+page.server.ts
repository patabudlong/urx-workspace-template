import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	teamInvitationDefaults,
	teamInvitationSchema
} from '$lib/shared/schemas/team-invitation';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(teamInvitationSchema), {
		defaults: teamInvitationDefaults
	});

	return {
		form,
		meta: {
			title: 'Invitations'
		}
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(teamInvitationSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		return message(form, 'Invitation sent.');
	}
};
