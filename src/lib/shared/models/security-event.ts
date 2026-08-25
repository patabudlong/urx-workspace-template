import type { ObjectId } from 'mongodb';

export const SECURITY_EVENT_SCOPES = {
	ACCOUNT: 'account',
	WORKSPACE: 'workspace',
	PLATFORM: 'platform'
} as const;

export type SecurityEventScope = (typeof SECURITY_EVENT_SCOPES)[keyof typeof SECURITY_EVENT_SCOPES];

export const SECURITY_EVENT_CATEGORIES = {
	AUTH: 'auth',
	ACCOUNT: 'account',
	WORKSPACE: 'workspace',
	PLATFORM: 'platform'
} as const;

export type SecurityEventCategory =
	(typeof SECURITY_EVENT_CATEGORIES)[keyof typeof SECURITY_EVENT_CATEGORIES];

export const SECURITY_EVENT_SEVERITIES = {
	INFO: 'info',
	WARNING: 'warning',
	CRITICAL: 'critical'
} as const;

export type SecurityEventSeverity =
	(typeof SECURITY_EVENT_SEVERITIES)[keyof typeof SECURITY_EVENT_SEVERITIES];

export const SECURITY_EVENT_ACTIONS = {
	LOGIN_SUCCESS: 'auth.login_success',
	LOGIN_FAILED: 'auth.login_failed',
	LOGOUT: 'auth.logout',
	TWO_FACTOR_CHALLENGE: 'auth.two_factor_challenge',
	TWO_FACTOR_SUCCESS: 'auth.two_factor_success',
	TWO_FACTOR_FAILED: 'auth.two_factor_failed',
	PASSWORD_RESET_REQUESTED: 'account.password_reset_requested',
	PASSWORD_RESET_COMPLETED: 'account.password_reset_completed',
	PASSWORD_CHANGED: 'account.password_changed',
	TWO_FACTOR_ENABLED: 'account.two_factor_enabled',
	TWO_FACTOR_DISABLED: 'account.two_factor_disabled',
	TRUSTED_DEVICE_REVOKED: 'account.trusted_device_revoked',
	BACKUP_CODES_REGENERATED: 'account.backup_codes_regenerated',
	MEMBER_ROLE_CHANGED: 'workspace.member_role_changed',
	MEMBER_REMOVED: 'workspace.member_removed',
	INVITATION_SENT: 'workspace.invitation_sent',
	INVITATION_ACCEPTED: 'workspace.invitation_accepted',
	INVITATION_REVOKED: 'workspace.invitation_revoked',
	WORKSPACE_SETTINGS_UPDATED: 'workspace.settings_updated',
	WORKSPACE_APPROVED: 'platform.workspace_approved',
	WORKSPACE_REJECTED: 'platform.workspace_rejected'
} as const;

export type SecurityEventAction =
	(typeof SECURITY_EVENT_ACTIONS)[keyof typeof SECURITY_EVENT_ACTIONS];

export type SecurityEventDocument = {
	_id: ObjectId;
	scope: SecurityEventScope;
	category: SecurityEventCategory;
	action: SecurityEventAction;
	severity: SecurityEventSeverity;
	/** User who performed the action (when known). */
	actorUserId?: ObjectId;
	/** Account owner for account-scoped events. */
	userId?: ObjectId;
	workspaceId?: ObjectId;
	targetUserId?: ObjectId;
	ipAddress?: string;
	userAgent?: string;
	isUnusualLocation?: boolean;
	metadata?: Record<string, unknown>;
	createdAt: Date;
};

export type SecurityEventSummary = {
	id: string;
	scope: SecurityEventScope;
	category: SecurityEventCategory;
	action: SecurityEventAction;
	severity: SecurityEventSeverity;
	actorUserId: string | null;
	userId: string | null;
	workspaceId: string | null;
	targetUserId: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	isUnusualLocation: boolean;
	metadata: Record<string, unknown>;
	createdAt: string;
};
