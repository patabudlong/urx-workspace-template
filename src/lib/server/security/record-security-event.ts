import type { RequestEvent } from '@sveltejs/kit';
import {
	insertSecurityEvent,
	listRecentLoginNetworksForUser
} from '$lib/server/repositories/security-events';
import { runInBackground } from '$lib/server/runtime/background-task';
import { formatUserAgentLabel } from '$lib/shared/format-user-agent';
import { trySendSecurityAlertEmail } from '$lib/server/mail/security-alert-email';
import {
	notifySecurityPasswordChanged,
	notifySecurityPasswordResetCompleted,
	notifySecurityUnusualLogin
} from '$lib/server/notifications/record-notification';
import {
	SECURITY_EMAIL_KINDS,
	SECURITY_EMAIL_LEVELS
} from '$lib/shared/mail/security-alert-email';
import {
	SECURITY_EVENT_ACTIONS,
	SECURITY_EVENT_CATEGORIES,
	SECURITY_EVENT_SCOPES,
	SECURITY_EVENT_SEVERITIES,
	type SecurityEventAction,
	type SecurityEventCategory,
	type SecurityEventScope,
	type SecurityEventSeverity
} from '$lib/shared/models/security-event';

export type SecurityEventRequestContext = {
	ipAddress?: string;
	userAgent?: string;
	workspaceId?: string;
};

export function buildSecurityEventRequestContext(
	event: Pick<RequestEvent, 'request' | 'getClientAddress'>
): SecurityEventRequestContext {
	return {
		ipAddress: event.getClientAddress(),
		userAgent: event.request.headers.get('user-agent') ?? undefined
	};
}

export function recordSecurityEventInBackground(
	event: Pick<RequestEvent, 'platform'>,
	input: Parameters<typeof recordSecurityEvent>[0]
): void {
	runInBackground(event, async () => {
		await recordSecurityEvent(input);
	});
}

function runSecurityTask(
	event: Pick<RequestEvent, 'platform'> | undefined,
	task: () => Promise<void>
): void {
	if (event) {
		runInBackground(event, task);
		return;
	}

	void task().catch((error) => {
		console.error('Failed to record security event', error);
	});
}

export function recordLoginSuccessInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordLoginSuccess>[0]
): void {
	runSecurityTask(event, () => recordLoginSuccess(input));
}

export function recordLoginFailedInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordLoginFailed>[0]
): void {
	runSecurityTask(event, () => recordLoginFailed(input));
}

export function recordLogoutInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordLogout>[0]
): void {
	runSecurityTask(event, () => recordLogout(input));
}

export function recordTwoFactorChallengeInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordTwoFactorChallenge>[0]
): void {
	runSecurityTask(event, () => recordTwoFactorChallenge(input));
}

export function recordTwoFactorSuccessInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordTwoFactorSuccess>[0]
): void {
	runSecurityTask(event, () => recordTwoFactorSuccess(input));
}

export function recordTwoFactorFailedInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordTwoFactorFailed>[0]
): void {
	runSecurityTask(event, () => recordTwoFactorFailed(input));
}

export async function recordSecurityEvent(input: {
	scope: SecurityEventScope;
	category: SecurityEventCategory;
	action: SecurityEventAction;
	severity?: SecurityEventSeverity;
	actorUserId?: string;
	userId?: string;
	workspaceId?: string;
	targetUserId?: string;
	ipAddress?: string;
	userAgent?: string;
	isUnusualLocation?: boolean;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	try {
		await insertSecurityEvent({
			...input,
			severity: input.severity ?? SECURITY_EVENT_SEVERITIES.INFO
		});
	} catch (error) {
		console.error('Failed to record security event', { action: input.action, error });
	}
}

function isPrivateOrLocalIp(ipAddress: string): boolean {
	const normalized = ipAddress.trim().toLowerCase();

	if (
		normalized === '::1' ||
		normalized === '127.0.0.1' ||
		normalized.startsWith('127.') ||
		normalized.startsWith('10.') ||
		normalized.startsWith('192.168.') ||
		normalized.startsWith('169.254.') ||
		normalized === 'localhost'
	) {
		return true;
	}

	const private172 = /^172\.(1[6-9]|2\d|3[01])\./;
	return private172.test(normalized);
}

export function normalizeIpNetwork(ipAddress: string): string | null {
	const ip = ipAddress.trim();

	if (!ip || isPrivateOrLocalIp(ip)) {
		return null;
	}

	if (ip.includes(':')) {
		const segments = ip.split(':').filter(Boolean);
		return segments.slice(0, 4).join(':').toLowerCase();
	}

	const octets = ip.split('.');

	if (octets.length !== 4) {
		return null;
	}

	return `${octets[0]}.${octets[1]}.${octets[2]}`;
}

export async function isUnusualLoginLocation(userId: string, ipAddress: string): Promise<boolean> {
	const network = normalizeIpNetwork(ipAddress);

	if (!network) {
		return false;
	}

	const recentNetworks = (await listRecentLoginNetworksForUser(userId))
		.map((ip) => normalizeIpNetwork(ip))
		.filter((value): value is string => Boolean(value));

	if (recentNetworks.length === 0) {
		return false;
	}

	return !recentNetworks.includes(network);
}

function buildDeviceMetadata(userAgent?: string): Record<string, unknown> {
	return {
		deviceLabel: formatUserAgentLabel(userAgent)
	};
}

async function notifySecurityEmail(input: {
	userId: string;
	level: typeof SECURITY_EMAIL_LEVELS.WARNING | typeof SECURITY_EMAIL_LEVELS.ALERT;
	kind: (typeof SECURITY_EMAIL_KINDS)[keyof typeof SECURITY_EMAIL_KINDS];
	origin?: string;
	ipAddress?: string;
	userAgent?: string;
}): Promise<void> {
	await trySendSecurityAlertEmail({
		userId: input.userId,
		level: input.level,
		kind: input.kind,
		origin: input.origin,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		occurredAt: new Date()
	});
}

export async function recordLoginSuccess(input: {
	userId: string;
	email?: string;
	ipAddress?: string;
	userAgent?: string;
	method?: 'password' | 'google' | 'two_factor';
	workspaceId?: string;
	origin?: string;
}): Promise<void> {
	const isUnusualLocation = input.ipAddress
		? await isUnusualLoginLocation(input.userId, input.ipAddress)
		: false;

	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.AUTH,
		action: SECURITY_EVENT_ACTIONS.LOGIN_SUCCESS,
		severity: isUnusualLocation
			? SECURITY_EVENT_SEVERITIES.WARNING
			: SECURITY_EVENT_SEVERITIES.INFO,
		actorUserId: input.userId,
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		isUnusualLocation,
		metadata: {
			...buildDeviceMetadata(input.userAgent),
			method: input.method,
			email: input.email,
			...(isUnusualLocation
				? {
						detail: 'Signed in from a network that has not been used recently for this account.'
					}
				: {})
		}
	});

	if (input.workspaceId) {
		await recordSecurityEvent({
			scope: SECURITY_EVENT_SCOPES.WORKSPACE,
			category: SECURITY_EVENT_CATEGORIES.AUTH,
			action: SECURITY_EVENT_ACTIONS.LOGIN_SUCCESS,
			severity: isUnusualLocation
				? SECURITY_EVENT_SEVERITIES.WARNING
				: SECURITY_EVENT_SEVERITIES.INFO,
			actorUserId: input.userId,
			workspaceId: input.workspaceId,
			ipAddress: input.ipAddress,
			userAgent: input.userAgent,
			isUnusualLocation,
			metadata: {
				...buildDeviceMetadata(input.userAgent),
				method: input.method,
				email: input.email,
				...(isUnusualLocation
					? {
							detail: 'A member signed in from an unusual network.'
						}
					: {})
			}
		});
	}

	if (isUnusualLocation) {
		await notifySecurityEmail({
			userId: input.userId,
			level: SECURITY_EMAIL_LEVELS.WARNING,
			kind: SECURITY_EMAIL_KINDS.UNUSUAL_LOGIN,
			origin: input.origin,
			ipAddress: input.ipAddress,
			userAgent: input.userAgent
		});

		await notifySecurityUnusualLogin({
			recipientUserId: input.userId,
			ipAddress: input.ipAddress,
			deviceLabel: formatUserAgentLabel(input.userAgent)
		});
	}
}

export async function recordLoginFailed(input: {
	email: string;
	ipAddress?: string;
	userAgent?: string;
	reason?: 'invalid_credentials' | 'email_not_verified';
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.AUTH,
		action: SECURITY_EVENT_ACTIONS.LOGIN_FAILED,
		severity: SECURITY_EVENT_SEVERITIES.WARNING,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: {
			email: input.email.trim().toLowerCase(),
			reason: input.reason,
			...buildDeviceMetadata(input.userAgent)
		}
	});
}

export async function recordLogout(input: {
	userId: string;
	ipAddress?: string;
	userAgent?: string;
	workspaceId?: string;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.AUTH,
		action: SECURITY_EVENT_ACTIONS.LOGOUT,
		actorUserId: input.userId,
		userId: input.userId,
		workspaceId: input.workspaceId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: buildDeviceMetadata(input.userAgent)
	});
}

export async function recordTwoFactorChallenge(input: {
	userId: string;
	ipAddress?: string;
	userAgent?: string;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.AUTH,
		action: SECURITY_EVENT_ACTIONS.TWO_FACTOR_CHALLENGE,
		actorUserId: input.userId,
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: buildDeviceMetadata(input.userAgent)
	});
}

export async function recordTwoFactorSuccess(input: {
	userId: string;
	ipAddress?: string;
	userAgent?: string;
	method?: string;
	workspaceId?: string;
	origin?: string;
}): Promise<void> {
	const isUnusualLocation = input.ipAddress
		? await isUnusualLoginLocation(input.userId, input.ipAddress)
		: false;

	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.AUTH,
		action: SECURITY_EVENT_ACTIONS.TWO_FACTOR_SUCCESS,
		severity: isUnusualLocation
			? SECURITY_EVENT_SEVERITIES.WARNING
			: SECURITY_EVENT_SEVERITIES.INFO,
		actorUserId: input.userId,
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		isUnusualLocation,
		metadata: {
			...buildDeviceMetadata(input.userAgent),
			method: input.method,
			...(isUnusualLocation
				? {
						detail: 'Signed in from a network that has not been used recently for this account.'
					}
				: {})
		}
	});

	if (input.workspaceId) {
		await recordSecurityEvent({
			scope: SECURITY_EVENT_SCOPES.WORKSPACE,
			category: SECURITY_EVENT_CATEGORIES.AUTH,
			action: SECURITY_EVENT_ACTIONS.TWO_FACTOR_SUCCESS,
			severity: isUnusualLocation
				? SECURITY_EVENT_SEVERITIES.WARNING
				: SECURITY_EVENT_SEVERITIES.INFO,
			actorUserId: input.userId,
			workspaceId: input.workspaceId,
			ipAddress: input.ipAddress,
			userAgent: input.userAgent,
			isUnusualLocation,
			metadata: {
				...buildDeviceMetadata(input.userAgent),
				method: input.method,
				...(isUnusualLocation
					? {
							detail: 'A member signed in from an unusual network.'
						}
					: {})
			}
		});
	}

	if (isUnusualLocation) {
		await notifySecurityEmail({
			userId: input.userId,
			level: SECURITY_EMAIL_LEVELS.WARNING,
			kind: SECURITY_EMAIL_KINDS.UNUSUAL_LOGIN,
			origin: input.origin,
			ipAddress: input.ipAddress,
			userAgent: input.userAgent
		});

		await notifySecurityUnusualLogin({
			recipientUserId: input.userId,
			ipAddress: input.ipAddress,
			deviceLabel: formatUserAgentLabel(input.userAgent)
		});
	}
}

export async function recordTwoFactorFailed(input: {
	userId: string;
	ipAddress?: string;
	userAgent?: string;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.AUTH,
		action: SECURITY_EVENT_ACTIONS.TWO_FACTOR_FAILED,
		severity: SECURITY_EVENT_SEVERITIES.WARNING,
		actorUserId: input.userId,
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: buildDeviceMetadata(input.userAgent)
	});
}

export async function recordPasswordResetRequested(input: {
	userId: string;
	email: string;
	ipAddress?: string;
	userAgent?: string;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.ACCOUNT,
		action: SECURITY_EVENT_ACTIONS.PASSWORD_RESET_REQUESTED,
		actorUserId: input.userId,
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: {
			email: input.email,
			...buildDeviceMetadata(input.userAgent)
		}
	});
}

export async function recordPasswordResetCompleted(input: {
	userId: string;
	ipAddress?: string;
	userAgent?: string;
	origin?: string;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.ACCOUNT,
		action: SECURITY_EVENT_ACTIONS.PASSWORD_RESET_COMPLETED,
		severity: SECURITY_EVENT_SEVERITIES.CRITICAL,
		actorUserId: input.userId,
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: buildDeviceMetadata(input.userAgent)
	});

	await notifySecurityEmail({
		userId: input.userId,
		level: SECURITY_EMAIL_LEVELS.ALERT,
		kind: SECURITY_EMAIL_KINDS.PASSWORD_RESET_COMPLETED,
		origin: input.origin,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent
	});

	await notifySecurityPasswordResetCompleted({
		recipientUserId: input.userId
	});
}

export async function recordPasswordChanged(input: {
	userId: string;
	ipAddress?: string;
	userAgent?: string;
	origin?: string;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.ACCOUNT,
		action: SECURITY_EVENT_ACTIONS.PASSWORD_CHANGED,
		severity: SECURITY_EVENT_SEVERITIES.CRITICAL,
		actorUserId: input.userId,
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: buildDeviceMetadata(input.userAgent)
	});

	await notifySecurityEmail({
		userId: input.userId,
		level: SECURITY_EMAIL_LEVELS.ALERT,
		kind: SECURITY_EMAIL_KINDS.PASSWORD_CHANGED,
		origin: input.origin,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent
	});

	await notifySecurityPasswordChanged({
		recipientUserId: input.userId
	});
}

export async function recordAccountSecurityChange(input: {
	userId: string;
	action:
		| typeof SECURITY_EVENT_ACTIONS.TWO_FACTOR_ENABLED
		| typeof SECURITY_EVENT_ACTIONS.TWO_FACTOR_DISABLED
		| typeof SECURITY_EVENT_ACTIONS.TRUSTED_DEVICE_REVOKED
		| typeof SECURITY_EVENT_ACTIONS.BACKUP_CODES_REGENERATED;
	ipAddress?: string;
	userAgent?: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	const severity =
		input.action === SECURITY_EVENT_ACTIONS.TWO_FACTOR_DISABLED
			? SECURITY_EVENT_SEVERITIES.CRITICAL
			: SECURITY_EVENT_SEVERITIES.INFO;

	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.ACCOUNT,
		category: SECURITY_EVENT_CATEGORIES.ACCOUNT,
		action: input.action,
		severity,
		actorUserId: input.userId,
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: {
			...buildDeviceMetadata(input.userAgent),
			...input.metadata
		}
	});
}

export async function recordWorkspaceSecurityEvent(input: {
	workspaceId: string;
	actorUserId: string;
	action:
		| typeof SECURITY_EVENT_ACTIONS.MEMBER_ROLE_CHANGED
		| typeof SECURITY_EVENT_ACTIONS.MEMBER_REMOVED
		| typeof SECURITY_EVENT_ACTIONS.INVITATION_SENT
		| typeof SECURITY_EVENT_ACTIONS.INVITATION_ACCEPTED
		| typeof SECURITY_EVENT_ACTIONS.INVITATION_REVOKED
		| typeof SECURITY_EVENT_ACTIONS.WORKSPACE_SETTINGS_UPDATED;
	targetUserId?: string;
	ipAddress?: string;
	userAgent?: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	const severity =
		input.action === SECURITY_EVENT_ACTIONS.MEMBER_REMOVED
			? SECURITY_EVENT_SEVERITIES.CRITICAL
			: SECURITY_EVENT_SEVERITIES.INFO;

	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.WORKSPACE,
		category: SECURITY_EVENT_CATEGORIES.WORKSPACE,
		action: input.action,
		severity,
		actorUserId: input.actorUserId,
		workspaceId: input.workspaceId,
		targetUserId: input.targetUserId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: input.metadata
	});
}

export async function recordPlatformSecurityEvent(input: {
	actorUserId: string;
	action:
		| typeof SECURITY_EVENT_ACTIONS.WORKSPACE_APPROVED
		| typeof SECURITY_EVENT_ACTIONS.WORKSPACE_REJECTED;
	workspaceId: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.PLATFORM,
		category: SECURITY_EVENT_CATEGORIES.PLATFORM,
		action: input.action,
		severity: SECURITY_EVENT_SEVERITIES.INFO,
		actorUserId: input.actorUserId,
		workspaceId: input.workspaceId,
		metadata: input.metadata
	});
}

type DtrSecurityEventAction =
	| typeof SECURITY_EVENT_ACTIONS.DTR_DAY_UPDATED
	| typeof SECURITY_EVENT_ACTIONS.DTR_NG_IMPORTED
	| typeof SECURITY_EVENT_ACTIONS.DTR_SETTINGS_UPDATED
	| typeof SECURITY_EVENT_ACTIONS.DTR_WORK_SCHEDULES_UPDATED
	| typeof SECURITY_EVENT_ACTIONS.DTR_HOLIDAY_CALENDAR_UPDATED;

type PayrollSecurityEventAction =
	| typeof SECURITY_EVENT_ACTIONS.PAYROLL_RUN_CREATED
	| typeof SECURITY_EVENT_ACTIONS.PAYROLL_RUN_PROCESSED
	| typeof SECURITY_EVENT_ACTIONS.PAYROLL_RUN_DELETED
	| typeof SECURITY_EVENT_ACTIONS.PAYROLL_EMPLOYEE_CREATED
	| typeof SECURITY_EVENT_ACTIONS.PAYROLL_EMPLOYEE_UPDATED
	| typeof SECURITY_EVENT_ACTIONS.PAYROLL_EMPLOYEE_DEACTIVATED
	| typeof SECURITY_EVENT_ACTIONS.PAYROLL_SETTINGS_UPDATED
	| typeof SECURITY_EVENT_ACTIONS.PAYROLL_PAYSLIP_EMAILED;

function dtrEventSeverity(action: DtrSecurityEventAction): SecurityEventSeverity {
	if (action === SECURITY_EVENT_ACTIONS.DTR_NG_IMPORTED) {
		return SECURITY_EVENT_SEVERITIES.WARNING;
	}

	return SECURITY_EVENT_SEVERITIES.INFO;
}

function payrollEventSeverity(action: PayrollSecurityEventAction): SecurityEventSeverity {
	if (
		action === SECURITY_EVENT_ACTIONS.PAYROLL_RUN_DELETED ||
		action === SECURITY_EVENT_ACTIONS.PAYROLL_EMPLOYEE_DEACTIVATED
	) {
		return SECURITY_EVENT_SEVERITIES.CRITICAL;
	}

	if (action === SECURITY_EVENT_ACTIONS.PAYROLL_RUN_PROCESSED) {
		return SECURITY_EVENT_SEVERITIES.WARNING;
	}

	return SECURITY_EVENT_SEVERITIES.INFO;
}

export function recordDtrSecurityEventInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordDtrSecurityEvent>[0]
): void {
	runSecurityTask(event, () => recordDtrSecurityEvent(input));
}

export function recordPayrollSecurityEventInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordPayrollSecurityEvent>[0]
): void {
	runSecurityTask(event, () => recordPayrollSecurityEvent(input));
}

export async function recordDtrSecurityEvent(input: {
	workspaceId: string;
	actorUserId: string;
	action: DtrSecurityEventAction;
	ipAddress?: string;
	userAgent?: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.WORKSPACE,
		category: SECURITY_EVENT_CATEGORIES.DTR,
		action: input.action,
		severity: dtrEventSeverity(input.action),
		actorUserId: input.actorUserId,
		userId: input.actorUserId,
		workspaceId: input.workspaceId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: input.metadata
	});
}

export async function recordPayrollSecurityEvent(input: {
	workspaceId: string;
	actorUserId: string;
	action: PayrollSecurityEventAction;
	ipAddress?: string;
	userAgent?: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	await recordSecurityEvent({
		scope: SECURITY_EVENT_SCOPES.WORKSPACE,
		category: SECURITY_EVENT_CATEGORIES.PAYROLL,
		action: input.action,
		severity: payrollEventSeverity(input.action),
		actorUserId: input.actorUserId,
		userId: input.actorUserId,
		workspaceId: input.workspaceId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		metadata: input.metadata
	});
}
