import type { RequestEvent } from '@sveltejs/kit';
import { insertNotification } from '$lib/server/repositories/notifications';
import { runInBackground } from '$lib/server/runtime/background-task';
import { getNotificationPresentation } from '$lib/shared/notifications/presentations';
import {
	NOTIFICATION_ACTIONS,
	NOTIFICATION_CATEGORIES,
	NOTIFICATION_SEVERITIES,
	type NotificationAction,
	type NotificationCategory,
	type NotificationSeverity
} from '$lib/shared/models/notification';

export function recordNotificationInBackground(
	event: Pick<RequestEvent, 'platform'> | undefined,
	input: Parameters<typeof recordNotification>[0]
): void {
	const task = () => recordNotification(input);

	if (event) {
		runInBackground(event, task);
		return;
	}

	void task().catch((error) => {
		console.error('Failed to record notification', { action: input.action, error });
	});
}

export async function recordNotification(input: {
	recipientUserId: string;
	workspaceId?: string;
	category: NotificationCategory;
	action: NotificationAction;
	severity?: NotificationSeverity;
	title?: string;
	body?: string;
	href?: string;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	try {
		const presentation = getNotificationPresentation(input.action, input.metadata ?? {});

		await insertNotification({
			recipientUserId: input.recipientUserId,
			workspaceId: input.workspaceId,
			category: input.category,
			action: input.action,
			severity: input.severity,
			title: input.title ?? presentation.title,
			body: input.body ?? presentation.body,
			href: input.href,
			metadata: input.metadata
		});
	} catch (error) {
		console.error('Failed to record notification', { action: input.action, error });
	}
}

export async function notifyTeamInvitationReceived(input: {
	recipientUserId: string;
	workspaceId: string;
	workspaceName: string;
	inviterName: string;
	roleLabel: string;
	acceptUrl: string;
}): Promise<void> {
	await recordNotification({
		recipientUserId: input.recipientUserId,
		workspaceId: input.workspaceId,
		category: NOTIFICATION_CATEGORIES.TEAM,
		action: NOTIFICATION_ACTIONS.TEAM_INVITATION_RECEIVED,
		href: input.acceptUrl,
		metadata: {
			detail: `${input.inviterName} invited you to join ${input.workspaceName} as ${input.roleLabel}.`,
			workspaceName: input.workspaceName,
			inviterName: input.inviterName,
			roleLabel: input.roleLabel
		}
	});
}

export async function notifyTeamInvitationAccepted(input: {
	recipientUserId: string;
	workspaceId: string;
	inviteeEmail: string;
	roleLabel: string;
}): Promise<void> {
	await recordNotification({
		recipientUserId: input.recipientUserId,
		workspaceId: input.workspaceId,
		category: NOTIFICATION_CATEGORIES.TEAM,
		action: NOTIFICATION_ACTIONS.TEAM_INVITATION_ACCEPTED,
		href: '/team/members',
		metadata: {
			detail: `${input.inviteeEmail} accepted the invitation and joined as ${input.roleLabel}.`,
			inviteeEmail: input.inviteeEmail,
			roleLabel: input.roleLabel
		}
	});
}

export async function notifyTeamMemberRoleChanged(input: {
	recipientUserId: string;
	workspaceId: string;
	previousRoleLabel: string;
	newRoleLabel: string;
}): Promise<void> {
	await recordNotification({
		recipientUserId: input.recipientUserId,
		workspaceId: input.workspaceId,
		category: NOTIFICATION_CATEGORIES.TEAM,
		action: NOTIFICATION_ACTIONS.TEAM_MEMBER_ROLE_CHANGED,
		href: '/team/members',
		metadata: {
			detail: `Your role changed from ${input.previousRoleLabel} to ${input.newRoleLabel}.`,
			previousRoleLabel: input.previousRoleLabel,
			newRoleLabel: input.newRoleLabel
		}
	});
}

export async function notifyTeamMemberRemoved(input: {
	recipientUserId: string;
	workspaceId: string;
	workspaceName: string;
}): Promise<void> {
	await recordNotification({
		recipientUserId: input.recipientUserId,
		workspaceId: input.workspaceId,
		category: NOTIFICATION_CATEGORIES.TEAM,
		action: NOTIFICATION_ACTIONS.TEAM_MEMBER_REMOVED,
		severity: NOTIFICATION_SEVERITIES.WARNING,
		href: '/',
		metadata: {
			detail: `You were removed from ${input.workspaceName}.`,
			workspaceName: input.workspaceName
		}
	});
}

export async function notifySecurityUnusualLogin(input: {
	recipientUserId: string;
	ipAddress?: string;
	deviceLabel?: string;
}): Promise<void> {
	await recordNotification({
		recipientUserId: input.recipientUserId,
		category: NOTIFICATION_CATEGORIES.SECURITY,
		action: NOTIFICATION_ACTIONS.SECURITY_UNUSUAL_LOGIN,
		severity: NOTIFICATION_SEVERITIES.WARNING,
		href: '/security/activity?unusual=true',
		metadata: {
			detail: 'Your account signed in from a network that has not been used recently.',
			ipAddress: input.ipAddress,
			deviceLabel: input.deviceLabel
		}
	});
}

export async function notifySecurityPasswordChanged(input: {
	recipientUserId: string;
}): Promise<void> {
	await recordNotification({
		recipientUserId: input.recipientUserId,
		category: NOTIFICATION_CATEGORIES.SECURITY,
		action: NOTIFICATION_ACTIONS.SECURITY_PASSWORD_CHANGED,
		severity: NOTIFICATION_SEVERITIES.CRITICAL,
		href: '/security/activity'
	});
}

export async function notifySecurityPasswordResetCompleted(input: {
	recipientUserId: string;
}): Promise<void> {
	await recordNotification({
		recipientUserId: input.recipientUserId,
		category: NOTIFICATION_CATEGORIES.SECURITY,
		action: NOTIFICATION_ACTIONS.SECURITY_PASSWORD_RESET_COMPLETED,
		severity: NOTIFICATION_SEVERITIES.CRITICAL,
		href: '/security/activity'
	});
}
