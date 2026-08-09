import { env } from '$env/dynamic/private';
import { isAuthRateLimitEnabled } from '$lib/server/security/auth-rate-limit';

const DEFAULT_FORM_MAX_ATTEMPTS = 15;
const DEFAULT_FORM_WINDOW_SECONDS = 600;
const DEFAULT_VERIFY_CODE_MAX_ATTEMPTS = 10;
const DEFAULT_VERIFY_CODE_WINDOW_SECONDS = 900;

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getFormMaxAttempts(): number {
	const configured = Number(env.ACCOUNT_PHONE_FORM_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_FORM_MAX_ATTEMPTS;
}

function getFormWindowMs(): number {
	const configured = Number(env.ACCOUNT_PHONE_FORM_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_FORM_WINDOW_SECONDS * 1000;
}

function getVerifyCodeMaxAttempts(): number {
	const configured = Number(env.ACCOUNT_PHONE_VERIFY_CODE_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_VERIFY_CODE_MAX_ATTEMPTS;
}

function getVerifyCodeWindowMs(): number {
	const configured = Number(env.ACCOUNT_PHONE_VERIFY_CODE_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_VERIFY_CODE_WINDOW_SECONDS * 1000;
}

function consumeRateLimit(
	key: string,
	config: { maxAttempts: number; windowMs: number }
): { ok: true } | { ok: false; retryAfterSeconds: number } {
	if (!isAuthRateLimitEnabled()) {
		return { ok: true };
	}

	const now = Date.now();
	let entry = store.get(key);

	if (!entry || entry.resetAt <= now) {
		entry = { count: 1, resetAt: now + config.windowMs };
		store.set(key, entry);
		return { ok: true };
	}

	entry.count += 1;

	if (entry.count > config.maxAttempts) {
		return {
			ok: false,
			retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
		};
	}

	return { ok: true };
}

export function consumeAccountPhoneFormRateLimit(input: {
	clientIp: string;
	action: 'update' | 'resend' | 'verify';
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
	return consumeRateLimit(`account-phone:${input.action}:ip:${input.clientIp}`, {
		maxAttempts: getFormMaxAttempts(),
		windowMs: getFormWindowMs()
	});
}

export function consumePhoneVerifyCodeAttempt(input: {
	userId: string;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
	return consumeRateLimit(`account-phone:verify-code:user:${input.userId}`, {
		maxAttempts: getVerifyCodeMaxAttempts(),
		windowMs: getVerifyCodeWindowMs()
	});
}
