import {
	formatVerificationResendCooldownLabel,
	VERIFICATION_RESEND_COOLDOWN_SECONDS
} from '$lib/shared/verification-resend-cooldown';

type VerificationResendCooldownOptions = {
	cooldownSeconds?: number;
	idleLabel?: string;
	activeLabel?: (remaining: number) => string;
};

export function createVerificationResendCooldown(options: VerificationResendCooldownOptions = {}) {
	const cooldownSeconds = options.cooldownSeconds ?? VERIFICATION_RESEND_COOLDOWN_SECONDS;
	const idleLabel = options.idleLabel ?? 'Resend code';

	let remaining = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	const active = $derived(remaining > 0);
	const label = $derived(
		formatVerificationResendCooldownLabel(remaining, {
			idle: idleLabel,
			active: options.activeLabel
		})
	);

	function clearTimer() {
		if (timer !== null) {
			clearInterval(timer);
			timer = null;
		}
	}

	function start(seconds = cooldownSeconds) {
		clearTimer();

		if (seconds <= 0) {
			remaining = 0;
			return;
		}

		remaining = seconds;
		timer = setInterval(() => {
			remaining = Math.max(0, remaining - 1);

			if (remaining <= 0) {
				clearTimer();
			}
		}, 1000);
	}

	function reset() {
		clearTimer();
		remaining = 0;
	}

	return {
		get remaining() {
			return remaining;
		},
		get active() {
			return active;
		},
		get label() {
			return label;
		},
		start,
		reset
	};
}

export type VerificationResendCooldown = ReturnType<typeof createVerificationResendCooldown>;
