import { formatRateLimitCountdown } from '$lib/shared/auth-messages';

/** Client-side cooldown between verification code resends (UX guard before server limits). */
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

export function formatVerificationResendCooldownLabel(
	remainingSeconds: number,
	options: {
		idle: string;
		active?: (remaining: number) => string;
	}
): string {
	if (remainingSeconds <= 0) {
		return options.idle;
	}

	const formatActive =
		options.active ??
		((remaining) => `Resend in ${formatRateLimitCountdown(remaining)}`);

	return formatActive(remainingSeconds);
}
