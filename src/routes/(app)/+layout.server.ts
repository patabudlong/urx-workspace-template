import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { loadUserDisplay } from '$lib/server/user-display';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	const access = await getOnboardingAccessState(locals.user.id);

	if (access.status !== 'ready' && url.pathname !== '/onboarding') {
		redirect(303, '/onboarding');
	}

	const userDisplay = await loadUserDisplay(locals.user.id, locals.user.email);

	return {
		user: locals.user,
		workspace: access.status === 'ready' ? access : null,
		userDisplay
	};
};
