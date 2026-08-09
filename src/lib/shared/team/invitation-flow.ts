import { safeEmailPrefill } from '$lib/shared/auth-prefill';

export function isAcceptInvitationRedirect(path: string | null | undefined): boolean {
	if (!path || path === '/') {
		return false;
	}

	return path.startsWith('/accept-invitation');
}

export function getInvitationFlowLockedEmail(
	redirectTo: string,
	emailParam: string | null | undefined
): string | null {
	if (!isAcceptInvitationRedirect(redirectTo)) {
		return null;
	}

	const email = safeEmailPrefill(emailParam);

	return email || null;
}
