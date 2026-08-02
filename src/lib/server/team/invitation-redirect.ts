import {
	acceptWorkspaceInvitation,
	type WorkspaceInvitationPreview
} from '$lib/server/team/workspace-invitations';
import { resolveWorkspaceLandingUrl } from '$lib/server/workspace-host';

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

export async function completeInvitationIfPossible(input: {
	token: string;
	userId: string;
	userEmail: string;
	requestUrl: URL;
}): Promise<{ ok: true; landingPath: string } | { ok: false }> {
	const result = await acceptWorkspaceInvitation({
		token: input.token,
		userId: input.userId,
		userEmail: input.userEmail
	});

	if (!result.ok) {
		return { ok: false };
	}

	const landing = resolveWorkspaceLandingUrl(result.workspaceSlug, input.requestUrl, '/');

	return {
		ok: true,
		landingPath: `${landing}${landing.includes('?') ? '&' : '?'}invitation=accepted`
	};
}

export async function resolveInvitationAwareLandingPath(input: {
	userId: string;
	userEmail: string;
	requestedPath: string;
	requestUrl: URL;
}): Promise<string | null> {
	const token = parseInvitationTokenFromPath(input.requestedPath);

	if (!token) {
		return null;
	}

	const completed = await completeInvitationIfPossible({
		token,
		userId: input.userId,
		userEmail: input.userEmail,
		requestUrl: input.requestUrl
	});

	if (completed.ok) {
		return completed.landingPath;
	}

	return input.requestedPath;
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
