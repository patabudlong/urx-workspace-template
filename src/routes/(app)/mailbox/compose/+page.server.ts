import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isMailboxConfigured } from '$lib/server/mailbox';

export const load: PageServerLoad = async ({ locals }) => {
	if (!(await isMailboxConfigured(locals.user!.id))) {
		redirect(303, '/mailbox/settings');
	}

	return {
		configured: true
	};
};
