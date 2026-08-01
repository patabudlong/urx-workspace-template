import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';
import { findUserById } from '$lib/server/repositories/users';

export const PLATFORM_ADMIN_HOME = '/admin/workspace-requests';

export function safeRedirectPath(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return '/';
	}

	return value;
}

export async function resolveAuthenticatedLandingPath(
	userId: string,
	requestedPath?: string | null
): Promise<string> {
	const path = safeRedirectPath(requestedPath);
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

	return path;
}
