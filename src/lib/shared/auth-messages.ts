export const FORGOT_PASSWORD_SUCCESS_MESSAGE =
	'If an account exists for that email, we sent a link to reset your password. Check your inbox and spam folder.';

export const SIGNUP_VERIFICATION_SENT_MESSAGE =
	'Your account was created. We sent a 6-digit verification code to your email — check your inbox and spam folder.';

export const RESEND_VERIFICATION_SUCCESS_MESSAGE =
	'If an account exists for that email and is not yet verified, we sent a new verification code. Check your inbox and spam folder.';

export const EMAIL_NOT_VERIFIED_MESSAGE =
	'Please verify your email before signing in. Check your inbox or resend a verification code.';

export const PASSWORD_REUSE_MESSAGE =
	'Your new password cannot match your current password or any of your last 5 passwords.';

export const PASSWORD_WEAK_MESSAGE = 'Password does not meet all requirements.';

export const AUTH_RATE_LIMIT_MESSAGE =
	'Too many attempts. Please wait a few minutes and try again.';

export type AuthRateLimitMessage = {
	type: 'rate_limited';
	text: string;
	retryAfterSeconds: number;
};

export type AuthFormMessage = string | AuthRateLimitMessage;

export function isAuthRateLimitMessage(message: unknown): message is AuthRateLimitMessage {
	return (
		typeof message === 'object' &&
		message !== null &&
		'type' in message &&
		message.type === 'rate_limited' &&
		'retryAfterSeconds' in message &&
		typeof message.retryAfterSeconds === 'number'
	);
}

export function createAuthRateLimitMessage(retryAfterSeconds: number): AuthRateLimitMessage {
	return {
		type: 'rate_limited',
		text: AUTH_RATE_LIMIT_MESSAGE,
		retryAfterSeconds
	};
}

export function formatRateLimitCountdown(seconds: number): string {
	const safeSeconds = Math.max(0, Math.ceil(seconds));

	if (safeSeconds <= 0) {
		return 'now';
	}

	const minutes = Math.floor(safeSeconds / 60);
	const remainingSeconds = safeSeconds % 60;

	if (minutes > 0) {
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	return `${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
}

export function formatAuthRateLimitMessage(retryAfterSeconds: number): string {
	if (retryAfterSeconds <= 0) {
		return 'Too many attempts. You can try again now.';
	}

	return `Too many attempts. Try again in ${formatRateLimitCountdown(retryAfterSeconds)}.`;
}

export function parseRateLimitRetryAfter(value: string | null | undefined): number | null {
	const parsed = Number(value);

	if (!Number.isFinite(parsed) || parsed <= 0) {
		return null;
	}

	return Math.ceil(parsed);
}

export function getAuthRedirectAlert(searchParams: URLSearchParams): {
	message: string | null;
	rateLimitRetryAfter: number | null;
} {
	const error = searchParams.get('error');

	if (error === 'rate_limited') {
		return {
			message: AUTH_RATE_LIMIT_MESSAGE,
			rateLimitRetryAfter: parseRateLimitRetryAfter(searchParams.get('retry'))
		};
	}

	return {
		message: null,
		rateLimitRetryAfter: null
	};
}
