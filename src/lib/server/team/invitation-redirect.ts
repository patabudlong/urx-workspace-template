import type { WorkspaceInvitationPreview } from '$lib/server/team/workspace-invitations';

export function parseInvitationTokenFromPath(path: string): string | null {
	if (!path.startsWith('/accept-invitation')) {
		return null;
	}

	const queryIndex = path.indexOf('?');

	if (queryIndex === -1) {
		return null;
	}

	const token = new URLSearchParams(path.slice(queryIndex + 1)).get('token')?.trim();

	return token || null;
}

export function isAcceptInvitationPath(path: string): boolean {
	return path.startsWith('/accept-invitation');
}

export function invitationMatchesUser(
	invitation: WorkspaceInvitationPreview | null,
	userEmail: string | null | undefined
): boolean {
	if (!invitation || !userEmail) {
		return false;
	}

	return userEmail.trim().toLowerCase() === invitation.invitedEmail;
}
