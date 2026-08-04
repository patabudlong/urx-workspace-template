import type { Actions, PageServerLoad } from './$types';
import { completeLogout } from '$lib/server/auth/logout';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { parseWorkspaceSlugFromRequest } from '$lib/server/workspace-host';

async function resolveLogoutWorkspaceSlug(
	url: URL,
	userId: string | undefined
): Promise<string | undefined> {
	const hostSlug = parseWorkspaceSlugFromRequest(url);

	if (hostSlug) {
		return hostSlug;
	}

	const querySlug = url.searchParams.get('workspaceSlug')?.trim().toLowerCase();

	if (querySlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(querySlug)) {
		return querySlug;
	}

	if (!userId) {
		return undefined;
	}

	const access = await getOnboardingAccessState(userId);

	if (access.status === 'ready' || access.status === 'pending_review') {
		return access.workspaceSlug;
	}

	return undefined;
}

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
