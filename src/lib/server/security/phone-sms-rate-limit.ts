import { env } from '$env/dynamic/private';
import { isAuthRateLimitEnabled } from '$lib/server/security/auth-rate-limit';

const DEFAULT_PHONE_MAX_ATTEMPTS = 3;
const DEFAULT_PHONE_WINDOW_SECONDS = 3600;
const DEFAULT_USER_MAX_ATTEMPTS = 5;
const DEFAULT_USER_WINDOW_SECONDS = 3600;

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getPhoneMaxAttempts(): number {
	const configured = Number(env.AUTH_VERIFICATION_SMS_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_PHONE_MAX_ATTEMPTS;
}

function getPhoneWindowMs(): number {
	const configured = Number(env.AUTH_VERIFICATION_SMS_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_PHONE_WINDOW_SECONDS * 1000;
}

function getUserMaxAttempts(): number {
	const configured = Number(env.AUTH_VERIFICATION_SMS_USER_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_USER_MAX_ATTEMPTS;
}

function getUserWindowMs(): number {
	const configured = Number(env.AUTH_VERIFICATION_SMS_USER_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_USER_WINDOW_SECONDS * 1000;
}

function phoneRateLimitKey(phoneNumber: string): string {
	return `verify-sms:phone:${phoneNumber.trim()}`;
}

function userRateLimitKey(userId: string): string {
	return `verify-sms:user:${userId}`;
}

function getRetryAfterSeconds(key: string): number {
	const entry = store.get(key);
	const now = Date.now();

	if (!entry || entry.resetAt <= now) {
		return 0;
	}

	return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
}

function isRateLimitExceeded(
	key: string,
	config: { maxAttempts: number; windowMs: number }
): boolean {
	if (!isAuthRateLimitEnabled()) {
		return false;
	}

	const now = Date.now();
	const entry = store.get(key);

	if (!entry || entry.resetAt <= now) {
		return false;
	}

	return entry.count >= config.maxAttempts;
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

function getPhoneConfig() {
	return {
		maxAttempts: getPhoneMaxAttempts(),
		windowMs: getPhoneWindowMs()
	};
}

function getUserConfig() {
	return {
		maxAttempts: getUserMaxAttempts(),
		windowMs: getUserWindowMs()
	};
}

export function isVerificationSmsThrottled(input: {
	phoneNumber: string;
	userId: string;
}): boolean {
	const phoneNumber = input.phoneNumber.trim();

	if (!phoneNumber) {
		return false;
	}

	const phoneConfig = getPhoneConfig();
	const userConfig = getUserConfig();

	return (
		isRateLimitExceeded(phoneRateLimitKey(phoneNumber), phoneConfig) ||
		isRateLimitExceeded(userRateLimitKey(input.userId), userConfig)
	);
}

export function getVerificationSmsRetryAfterSeconds(input: {
	phoneNumber: string;
	userId: string;
}): number {
	const phoneNumber = input.phoneNumber.trim();
	const phoneRetry = phoneNumber ? getRetryAfterSeconds(phoneRateLimitKey(phoneNumber)) : 0;
	const userRetry = getRetryAfterSeconds(userRateLimitKey(input.userId));

	return Math.max(phoneRetry, userRetry);
}

export function consumeVerificationSmsSend(input: {
	phoneNumber: string;
	userId: string;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
	const phoneNumber = input.phoneNumber.trim();

	if (!phoneNumber) {
		return { ok: false, retryAfterSeconds: 60 };
	}

	const phoneResult = consumeRateLimit(phoneRateLimitKey(phoneNumber), getPhoneConfig());

	if (!phoneResult.ok) {
		return phoneResult;
	}

	const userResult = consumeRateLimit(userRateLimitKey(input.userId), getUserConfig());

	if (!userResult.ok) {
		return userResult;
	}

	return { ok: true };
}
