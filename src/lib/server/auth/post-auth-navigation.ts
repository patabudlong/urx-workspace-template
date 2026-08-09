import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import { resolveCrossHostWorkspaceRedirect } from '$lib/server/auth/session-handoff';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { findUserById } from '$lib/server/repositories/users';
import { isAcceptInvitationPath } from '$lib/server/team/invitation-redirect';

export const PLATFORM_ADMIN_HOME = '/admin/workspace-requests';

export function safeRedirectPath(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return '/';
	}

	return value;
}

type ResolveAuthenticatedLandingPathOptions = {
	requestedPath?: string | null;
	requestUrl?: URL;
};

export async function resolveAuthenticatedLandingPath(
	userId: string,
	options: ResolveAuthenticatedLandingPathOptions = {}
): Promise<string> {
	const path = safeRedirectPath(options.requestedPath);
	const user = await findUserById(userId);

	if (user && isSuperadminUser(user)) {
		if (path === '/' || path.startsWith('/onboarding')) {
			return PLATFORM_ADMIN_HOME;
		}

		return path;
	}

	const access = await getOnboardingAccessState(userId);

	if (access.status !== 'ready' && (path === '/' || path.startsWith('/onboarding'))) {
		return '/onboarding';
	}

	if (isAcceptInvitationPath(path)) {
		return path;
	}

	if (access.status === 'ready' && options.requestUrl) {
		return resolveCrossHostWorkspaceRedirect(
			{ sub: userId, email: user?.email ?? '' },
			access.workspaceSlug,
			options.requestUrl,
			path
		);
	}

	return path;
}
