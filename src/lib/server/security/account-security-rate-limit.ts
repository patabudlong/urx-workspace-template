import { env } from '$env/dynamic/private';
import { isAuthRateLimitEnabled } from '$lib/server/security/auth-rate-limit';

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_WINDOW_SECONDS = 900;

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getMaxAttempts(): number {
	const configured = Number(env.ACCOUNT_SECURITY_CHANGE_PASSWORD_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_MAX_ATTEMPTS;
}

function getWindowMs(): number {
	const configured = Number(env.ACCOUNT_SECURITY_CHANGE_PASSWORD_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_WINDOW_SECONDS * 1000;
}

export function consumeChangePasswordRateLimit(input: {
	userId: string;
	clientIp: string;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
	if (!isAuthRateLimitEnabled()) {
		return { ok: true };
	}

	const now = Date.now();
	const key = `account-security:change-password:user:${input.userId}:ip:${input.clientIp}`;
	let entry = store.get(key);

	if (!entry || entry.resetAt <= now) {
		entry = { count: 1, resetAt: now + getWindowMs() };
		store.set(key, entry);
		return { ok: true };
	}

	entry.count += 1;

	if (entry.count > getMaxAttempts()) {
		return {
			ok: false,
			retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
		};
	}

	return { ok: true };
}
