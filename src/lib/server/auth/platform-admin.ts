import { env } from '$env/dynamic/private';
import type { UserDocument } from '$lib/shared/models/user';
import { PLATFORM_ROLES } from '$lib/shared/models/user';

export function isSuperadminUser(user: Pick<UserDocument, 'email' | 'platformRole'>): boolean {
	if (user.platformRole === PLATFORM_ROLES.SUPERADMIN) {
		return true;
	}

	const configured = env.SUPERADMIN_EMAILS?.split(',') ?? [];

	return configured
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean)
		.includes(user.email.trim().toLowerCase());
}

export function getWorkspaceReviewTeamEmail(): string | null {
	const value = env.WORKSPACE_REVIEW_TEAM_EMAIL?.trim();
	return value || null;
}
