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

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';

export const INVALID_VERIFICATION_CODE_MESSAGE =
	'That verification code is invalid or has expired.';

export const EMAIL_ALREADY_VERIFIED_MESSAGE =
	'This email is already verified. You can sign in.';

export const SECURITY_VERIFICATION_FAILED_MESSAGE =
	'Security verification failed. Please try again.';

export const SECURITY_VERIFICATION_FAILED_CLIENT_MESSAGE =
	'Security verification failed. Please refresh the page and try again.';

export const RESET_LINK_INVALID_MESSAGE = 'This reset link is invalid or has expired.';

export const AUTH_ALERT_FALLBACK_TITLE = 'Something went wrong';

export type AuthAlertVariant = 'info' | 'warning' | 'danger' | 'success' | 'plain';

export type AuthAlertPresentation = {
	title: string;
	description: string;
	variant?: AuthAlertVariant;
};

const AUTH_FORM_ALERT_PRESENTATIONS: Record<string, AuthAlertPresentation> = {
	[INVALID_CREDENTIALS_MESSAGE]: {
		title: 'Invalid email or password',
		description: 'Check your credentials and try again.'
	},
	[INVALID_VERIFICATION_CODE_MESSAGE]: {
		title: 'Verification failed',
		description: INVALID_VERIFICATION_CODE_MESSAGE
	},
	[EMAIL_ALREADY_VERIFIED_MESSAGE]: {
		title: 'Email already verified',
		description: EMAIL_ALREADY_VERIFIED_MESSAGE
	},
	[EMAIL_NOT_VERIFIED_MESSAGE]: {
		title: 'Email not verified',
		description: EMAIL_NOT_VERIFIED_MESSAGE
	},
	[AUTH_RATE_LIMIT_MESSAGE]: {
		title: 'Too many attempts',
		description: 'Please wait a few minutes and try again.'
	},
	[SECURITY_VERIFICATION_FAILED_MESSAGE]: {
		title: 'Security verification failed',
		description: 'Please try again.'
	},
	[SECURITY_VERIFICATION_FAILED_CLIENT_MESSAGE]: {
		title: 'Security verification failed',
		description: 'Please refresh the page and try again.'
	},
	[PASSWORD_REUSE_MESSAGE]: {
		title: 'Password not allowed',
		description: PASSWORD_REUSE_MESSAGE
	},
	[PASSWORD_WEAK_MESSAGE]: {
		title: 'Password too weak',
		description: PASSWORD_WEAK_MESSAGE
	},
	[RESET_LINK_INVALID_MESSAGE]: {
		title: 'Link expired',
		description: RESET_LINK_INVALID_MESSAGE
	},
	[FORGOT_PASSWORD_SUCCESS_MESSAGE]: {
		title: 'Check your email',
		description: FORGOT_PASSWORD_SUCCESS_MESSAGE,
		variant: 'info'
	},
	[SIGNUP_VERIFICATION_SENT_MESSAGE]: {
		title: 'Check your email',
		description: SIGNUP_VERIFICATION_SENT_MESSAGE,
		variant: 'info'
	},
	[RESEND_VERIFICATION_SUCCESS_MESSAGE]: {
		title: 'Check your email',
		description: RESEND_VERIFICATION_SUCCESS_MESSAGE,
		variant: 'info'
	}
};

export function getAuthFormAlertPresentation(message: string): AuthAlertPresentation | null {
	return AUTH_FORM_ALERT_PRESENTATIONS[message] ?? null;
}

export function resolveAuthFormAlertPresentation(message: string): AuthAlertPresentation {
	return (
		AUTH_FORM_ALERT_PRESENTATIONS[message] ?? {
			title: AUTH_ALERT_FALLBACK_TITLE,
			description: message
		}
	);
}

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
		return 'You can try again now.';
	}

	return `Try again in ${formatRateLimitCountdown(retryAfterSeconds)}.`;
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
