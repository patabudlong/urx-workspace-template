import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { SESSION_COOKIE_NAME } from '$lib/server/auth/session';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		redirect(303, '/login');
	}
};
