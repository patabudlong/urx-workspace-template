import { AUTH_RATE_LIMIT_MESSAGE } from '$lib/shared/auth-messages';

export const GOOGLE_AUTH_ERROR_MESSAGES = {
	google_cancelled: 'Google sign-in was cancelled.',
	google_auth_failed: 'Google sign-in failed. Please try again.',
	google_not_configured: 'Google sign-in is not configured on this server.',
	auth_not_configured: 'Authentication is not configured. Set JWT_SECRET in your environment.',
	google_account_conflict:
		'This email is already linked to a different sign-in method. Try signing in with email and password.',
	rate_limited: AUTH_RATE_LIMIT_MESSAGE
} as const;

export type GoogleAuthErrorCode = keyof typeof GOOGLE_AUTH_ERROR_MESSAGES;

export function getGoogleAuthErrorMessage(code: string | null | undefined): string | null {
	if (!code) {
		return null;
	}

	if (code in GOOGLE_AUTH_ERROR_MESSAGES) {
		return GOOGLE_AUTH_ERROR_MESSAGES[code as GoogleAuthErrorCode];
	}

	return GOOGLE_AUTH_ERROR_MESSAGES.google_auth_failed;
}
