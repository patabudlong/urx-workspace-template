import { env } from '$env/dynamic/private';
import { isAuthRateLimitEnabled } from '$lib/server/security/auth-rate-limit';

const DEFAULT_WORKSPACE_MAX_ATTEMPTS = 30;
const DEFAULT_WORKSPACE_WINDOW_SECONDS = 3600;
const DEFAULT_EMAIL_MAX_ATTEMPTS = 3;
const DEFAULT_EMAIL_WINDOW_SECONDS = 3600;
const DEFAULT_FORM_MAX_ATTEMPTS = 20;
const DEFAULT_FORM_WINDOW_SECONDS = 900;

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getWorkspaceMaxAttempts(): number {
	const configured = Number(env.TEAM_INVITE_WORKSPACE_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_WORKSPACE_MAX_ATTEMPTS;
}

function getWorkspaceWindowMs(): number {
	const configured = Number(env.TEAM_INVITE_WORKSPACE_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_WORKSPACE_WINDOW_SECONDS * 1000;
}

function getEmailMaxAttempts(): number {
	const configured = Number(env.TEAM_INVITE_EMAIL_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_EMAIL_MAX_ATTEMPTS;
}

function getEmailWindowMs(): number {
	const configured = Number(env.TEAM_INVITE_EMAIL_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_EMAIL_WINDOW_SECONDS * 1000;
}

function getFormMaxAttempts(): number {
	const configured = Number(env.TEAM_INVITE_FORM_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_FORM_MAX_ATTEMPTS;
}

function getFormWindowMs(): number {
	const configured = Number(env.TEAM_INVITE_FORM_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_FORM_WINDOW_SECONDS * 1000;
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

export function consumeTeamInvitationFormRateLimit(input: {
	clientIp: string;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
	return consumeRateLimit(`team-invite:ip:${input.clientIp}`, {
		maxAttempts: getFormMaxAttempts(),
		windowMs: getFormWindowMs()
	});
}

export function isTeamInvitationWorkspaceThrottled(workspaceId: string): boolean {
	return isRateLimitExceeded(`team-invite:workspace:${workspaceId}`, {
		maxAttempts: getWorkspaceMaxAttempts(),
		windowMs: getWorkspaceWindowMs()
	});
}

export function isTeamInvitationEmailThrottled(email: string): boolean {
	const normalizedEmail = email.trim().toLowerCase();

	if (!normalizedEmail) {
		return false;
	}

	return isRateLimitExceeded(`team-invite:email:${normalizedEmail}`, {
		maxAttempts: getEmailMaxAttempts(),
		windowMs: getEmailWindowMs()
	});
}

export function consumeTeamInvitationSend(input: {
	workspaceId: string;
	email: string;
}): boolean {
	const normalizedEmail = input.email.trim().toLowerCase();

	const workspaceResult = consumeRateLimit(`team-invite:workspace:${input.workspaceId}`, {
		maxAttempts: getWorkspaceMaxAttempts(),
		windowMs: getWorkspaceWindowMs()
	});

	if (!workspaceResult.ok) {
		return false;
	}

	const emailResult = consumeRateLimit(`team-invite:email:${normalizedEmail}`, {
		maxAttempts: getEmailMaxAttempts(),
		windowMs: getEmailWindowMs()
	});

	return emailResult.ok;
}
