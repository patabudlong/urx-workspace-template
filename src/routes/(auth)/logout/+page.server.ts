import type { Actions, PageServerLoad } from './$types';
import { completeLogout, resolveLogoutWorkspaceSlug } from '$lib/server/auth/logout';

export const load: PageServerLoad = async ({ cookies, url, locals }) => {
	const workspaceSlug = await resolveLogoutWorkspaceSlug(url, locals.user?.id);
	completeLogout(cookies, url, { workspaceSlug });
};

export const actions: Actions = {
	default: async ({ cookies, url, locals }) => {
		const workspaceSlug = await resolveLogoutWorkspaceSlug(url, locals.user?.id);
		completeLogout(cookies, url, { workspaceSlug });
	}
};
