import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { clearSessionCookie } from '$lib/server/auth/session';

export const actions: Actions = {
	default: async ({ cookies }) => {
		clearSessionCookie(cookies);
		redirect(303, '/login');
	}
};
