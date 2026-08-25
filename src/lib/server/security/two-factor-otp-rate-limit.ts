import { env } from '$env/dynamic/private';
import { isAuthRateLimitEnabled } from '$lib/server/security/auth-rate-limit';
import {
	consumeVerificationSmsSend,
	getVerificationSmsRetryAfterSeconds,
	isVerificationSmsThrottled
} from '$lib/server/security/phone-sms-rate-limit';

const DEFAULT_USER_MAX_ATTEMPTS = 5;
const DEFAULT_USER_WINDOW_SECONDS = 3600;
const DEFAULT_EMAIL_MAX_ATTEMPTS = 5;
const DEFAULT_EMAIL_WINDOW_SECONDS = 3600;
const DEFAULT_IP_MAX_ATTEMPTS = 10;
const DEFAULT_IP_WINDOW_SECONDS = 900;

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

export type TwoFactorOtpSendMethod = 'sms' | 'email';

function getUserMaxAttempts(): number {
	const configured = Number(env.AUTH_TWO_FACTOR_OTP_USER_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_USER_MAX_ATTEMPTS;
}

function getUserWindowMs(): number {
	const configured = Number(env.AUTH_TWO_FACTOR_OTP_USER_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_USER_WINDOW_SECONDS * 1000;
}

function getEmailMaxAttempts(): number {
	const configured = Number(env.AUTH_TWO_FACTOR_OTP_EMAIL_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_EMAIL_MAX_ATTEMPTS;
}

function getEmailWindowMs(): number {
	const configured = Number(env.AUTH_TWO_FACTOR_OTP_EMAIL_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_EMAIL_WINDOW_SECONDS * 1000;
}

function getIpMaxAttempts(): number {
	const configured = Number(env.AUTH_TWO_FACTOR_OTP_IP_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_IP_MAX_ATTEMPTS;
}

function getIpWindowMs(): number {
	const configured = Number(env.AUTH_TWO_FACTOR_OTP_IP_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_IP_WINDOW_SECONDS * 1000;
}

function userRateLimitKey(userId: string): string {
	return `two-factor-otp:user:${userId}`;
}

function emailRateLimitKey(userId: string): string {
	return `two-factor-otp:email:${userId}`;
}

function ipRateLimitKey(clientIp: string): string {
	return `two-factor-otp:ip:${clientIp}`;
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

function getUserConfig() {
	return {
		maxAttempts: getUserMaxAttempts(),
		windowMs: getUserWindowMs()
	};
}

function getEmailConfig() {
	return {
		maxAttempts: getEmailMaxAttempts(),
		windowMs: getEmailWindowMs()
	};
}

function getIpConfig() {
	return {
		maxAttempts: getIpMaxAttempts(),
		windowMs: getIpWindowMs()
	};
}

export function getTwoFactorOtpSendRetryAfterSeconds(input: {
	userId: string;
	method: TwoFactorOtpSendMethod;
	phoneNumber?: string;
	clientIp?: string;
}): number {
	const retries = [getRetryAfterSeconds(userRateLimitKey(input.userId))];

	if (input.clientIp) {
		retries.push(getRetryAfterSeconds(ipRateLimitKey(input.clientIp)));
	}

	if (input.method === 'sms' && input.phoneNumber) {
		retries.push(
			getVerificationSmsRetryAfterSeconds({
				phoneNumber: input.phoneNumber,
				userId: input.userId
			})
		);
	}

	if (input.method === 'email') {
		retries.push(getRetryAfterSeconds(emailRateLimitKey(input.userId)));
	}

	return Math.max(0, ...retries);
}

export function isTwoFactorOtpSendThrottled(input: {
	userId: string;
	method: TwoFactorOtpSendMethod;
	phoneNumber?: string;
	clientIp?: string;
}): boolean {
	if (!isAuthRateLimitEnabled()) {
		return false;
	}

	const userConfig = getUserConfig();
	const ipConfig = getIpConfig();

	if (isRateLimitExceeded(userRateLimitKey(input.userId), userConfig)) {
		return true;
	}

	if (input.clientIp && isRateLimitExceeded(ipRateLimitKey(input.clientIp), ipConfig)) {
		return true;
	}

	if (
		input.method === 'sms' &&
		input.phoneNumber &&
		isVerificationSmsThrottled({
			phoneNumber: input.phoneNumber,
			userId: input.userId
		})
	) {
		return true;
	}

	if (input.method === 'email' && isRateLimitExceeded(emailRateLimitKey(input.userId), getEmailConfig())) {
		return true;
	}

	return false;
}

export function consumeTwoFactorOtpSend(input: {
	userId: string;
	method: TwoFactorOtpSendMethod;
	phoneNumber?: string;
	clientIp?: string;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
	if (input.clientIp) {
		const ipResult = consumeRateLimit(ipRateLimitKey(input.clientIp), getIpConfig());

		if (!ipResult.ok) {
			return ipResult;
		}
	}

	const userResult = consumeRateLimit(userRateLimitKey(input.userId), getUserConfig());

	if (!userResult.ok) {
		return userResult;
	}

	if (input.method === 'sms' && input.phoneNumber) {
		return consumeVerificationSmsSend({
			phoneNumber: input.phoneNumber,
			userId: input.userId
		});
	}

	if (input.method === 'email') {
		return consumeRateLimit(emailRateLimitKey(input.userId), getEmailConfig());
	}

	return { ok: true };
}
