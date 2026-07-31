import { env } from '$env/dynamic/private';
import { AUTH_RATE_LIMIT_MESSAGE } from '$lib/shared/auth-messages';

const DEFAULT_MAX_ATTEMPTS = 20;
const DEFAULT_WINDOW_SECONDS = 900;
const DEFAULT_FORGOT_PASSWORD_MAX_ATTEMPTS = 5;
const DEFAULT_FORGOT_PASSWORD_WINDOW_SECONDS = 3600;
const DEFAULT_FORGOT_PASSWORD_EMAIL_MAX_ATTEMPTS = 3;
const DEFAULT_FORGOT_PASSWORD_EMAIL_WINDOW_SECONDS = 3600;

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function parseBooleanEnv(value: string | undefined): boolean | undefined {
	if (!value?.trim()) {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();

	if (normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes') {
		return true;
	}

	if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') {
		return false;
	}

	return undefined;
}

export function isAuthRateLimitEnabled(): boolean {
	const configured = parseBooleanEnv(env.AUTH_RATE_LIMIT_ENABLED);

	if (configured !== undefined) {
		return configured;
	}

	return process.env.NODE_ENV === 'production';
}

function getGlobalMaxAttempts(): number {
	const configured = Number(env.AUTH_RATE_LIMIT_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_MAX_ATTEMPTS;
}

function getGlobalWindowMs(): number {
	const configured = Number(env.AUTH_RATE_LIMIT_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_WINDOW_SECONDS * 1000;
}

function getForgotPasswordMaxAttempts(): number {
	const configured = Number(env.AUTH_RATE_LIMIT_FORGOT_PASSWORD_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_FORGOT_PASSWORD_MAX_ATTEMPTS;
}

function getForgotPasswordWindowMs(): number {
	const configured = Number(env.AUTH_RATE_LIMIT_FORGOT_PASSWORD_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_FORGOT_PASSWORD_WINDOW_SECONDS * 1000;
}

function getForgotPasswordEmailMaxAttempts(): number {
	const configured = Number(env.AUTH_FORGOT_PASSWORD_EMAIL_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_FORGOT_PASSWORD_EMAIL_MAX_ATTEMPTS;
}

function getForgotPasswordEmailWindowMs(): number {
	const configured = Number(env.AUTH_FORGOT_PASSWORD_EMAIL_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_FORGOT_PASSWORD_EMAIL_WINDOW_SECONDS * 1000;
}

function pruneExpiredEntries(now: number): void {
	for (const [key, entry] of store) {
		if (entry.resetAt <= now) {
			store.delete(key);
		}
	}
}

function normalizeAuthPath(pathname: string): string {
	const withoutTrailingSlash = pathname.replace(/\/+$/, '');

	if (!withoutTrailingSlash) {
		return '/';
	}

	return withoutTrailingSlash;
}

export function isForgotPasswordPath(pathname: string): boolean {
	const normalized = normalizeAuthPath(pathname);

	return normalized === '/forgot-password' || normalized === '/api/v1/auth/forgot-password';
}

function getRateLimitBucket(pathname: string): string {
	const normalized = normalizeAuthPath(pathname);

	if (normalized === '/auth/google' || normalized === '/auth/google/callback') {
		return 'oauth';
	}

	if (normalized === '/login' || normalized === '/api/v1/auth/login') {
		return 'login';
	}

	if (normalized === '/signup' || normalized === '/api/v1/auth/signup') {
		return 'signup';
	}

	if (isForgotPasswordPath(normalized)) {
		return 'forgot-password';
	}

	if (normalized === '/reset-password' || normalized === '/api/v1/auth/reset-password') {
		return 'reset-password';
	}

	if (normalized === '/api/v1/auth/consent') {
		return 'consent';
	}

	return 'auth';
}

function getPathRateLimitConfig(pathname: string): { maxAttempts: number; windowMs: number } {
	if (isForgotPasswordPath(pathname)) {
		return {
			maxAttempts: getForgotPasswordMaxAttempts(),
			windowMs: getForgotPasswordWindowMs()
		};
	}

	return {
		maxAttempts: getGlobalMaxAttempts(),
		windowMs: getGlobalWindowMs()
	};
}

function consumeRateLimit(
	key: string,
	config: { maxAttempts: number; windowMs: number }
): { ok: true } | { ok: false; retryAfterSeconds: number } {
	const now = Date.now();

	if (store.size > 0 && store.size % 100 === 0) {
		pruneExpiredEntries(now);
	}

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

const AUTH_API_RESOURCES = ['login', 'signup', 'forgot-password', 'reset-password', 'consent'] as const;

export const AUTH_FORM_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'] as const;

export function isAuthApiRateLimitedRoute(pathname: string, method: string): boolean {
	if (method !== 'POST' || !pathname.startsWith('/api/v1/auth/')) {
		return false;
	}

	const resource = normalizeAuthPath(pathname).slice('/api/v1/auth/'.length);

	return AUTH_API_RESOURCES.includes(resource as (typeof AUTH_API_RESOURCES)[number]);
}

export function isAuthFormRateLimitedRoute(pathname: string, method: string): boolean {
	return (
		method === 'POST' &&
		AUTH_FORM_PATHS.includes(normalizeAuthPath(pathname) as (typeof AUTH_FORM_PATHS)[number])
	);
}

export function isAuthOAuthRateLimitedRoute(pathname: string, method: string): boolean {
	const normalized = normalizeAuthPath(pathname);

	return method === 'GET' && (normalized === '/auth/google' || normalized === '/auth/google/callback');
}

export function consumeAuthRateLimit(input: {
	clientIp: string;
	pathname: string;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
	if (!isAuthRateLimitEnabled()) {
		return { ok: true };
	}

	const normalizedPath = normalizeAuthPath(input.pathname);
	const bucket = getRateLimitBucket(normalizedPath);
	const key = `${input.clientIp}:${bucket}`;
	const config = getPathRateLimitConfig(normalizedPath);

	return consumeRateLimit(key, config);
}

export function isForgotPasswordEmailThrottled(email: string): boolean {
	if (!isAuthRateLimitEnabled()) {
		return false;
	}

	const normalizedEmail = email.trim().toLowerCase();

	if (!normalizedEmail) {
		return false;
	}

	const result = consumeRateLimit(`forgot-email:${normalizedEmail}`, {
		maxAttempts: getForgotPasswordEmailMaxAttempts(),
		windowMs: getForgotPasswordEmailWindowMs()
	});

	return !result.ok;
}

export function getAuthRateLimitMessage(): string {
	return AUTH_RATE_LIMIT_MESSAGE;
}
