import type { Actions, PageServerLoad } from './$types';
import { completeLogout } from '$lib/server/auth/logout';

export const load: PageServerLoad = async ({ cookies, url }) => {
	completeLogout(cookies, url);
};

export const actions: Actions = {
	default: async ({ cookies, url }) => {
		completeLogout(cookies, url);
	}
};
