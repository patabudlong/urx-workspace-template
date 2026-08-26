import type { ObjectId } from 'mongodb';

export const NOTIFICATION_CATEGORIES = {
	SECURITY: 'security',
	TEAM: 'team',
	SYSTEM: 'system'
} as const;

export type NotificationCategory =
	(typeof NOTIFICATION_CATEGORIES)[keyof typeof NOTIFICATION_CATEGORIES];

export const NOTIFICATION_SEVERITIES = {
	INFO: 'info',
	WARNING: 'warning',
	CRITICAL: 'critical'
} as const;

export type NotificationSeverity =
	(typeof NOTIFICATION_SEVERITIES)[keyof typeof NOTIFICATION_SEVERITIES];

export const NOTIFICATION_ACTIONS = {
	TEAM_INVITATION_RECEIVED: 'team.invitation_received',
	TEAM_INVITATION_ACCEPTED: 'team.invitation_accepted',
	TEAM_MEMBER_ROLE_CHANGED: 'team.member_role_changed',
	TEAM_MEMBER_REMOVED: 'team.member_removed',
	SECURITY_UNUSUAL_LOGIN: 'security.unusual_login',
	SECURITY_PASSWORD_CHANGED: 'security.password_changed',
	SECURITY_PASSWORD_RESET_COMPLETED: 'security.password_reset_completed'
} as const;

export type NotificationAction =
	(typeof NOTIFICATION_ACTIONS)[keyof typeof NOTIFICATION_ACTIONS];

export type NotificationDocument = {
	_id: ObjectId;
	recipientUserId: ObjectId;
	workspaceId?: ObjectId;
	category: NotificationCategory;
	action: NotificationAction;
	severity: NotificationSeverity;
	title: string;
	body?: string;
	href?: string;
	metadata?: Record<string, unknown>;
	readAt?: Date;
	createdAt: Date;
	updatedAt: Date;
};

export type NotificationSummary = {
	id: string;
	workspaceId: string | null;
	category: NotificationCategory;
	action: NotificationAction;
	severity: NotificationSeverity;
	title: string;
	body: string | null;
	href: string | null;
	metadata: Record<string, unknown>;
	isRead: boolean;
	readAt: string | null;
	createdAt: string;
};
