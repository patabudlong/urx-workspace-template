import {
	NOTIFICATION_ACTIONS,
	type NotificationAction,
	type NotificationCategory
} from '$lib/shared/models/notification';

export function getNotificationCategoryLabel(category: NotificationCategory): string {
	switch (category) {
		case 'security':
			return 'Security';
		case 'team':
			return 'Team';
		case 'system':
			return 'System';
		default:
			return 'Notification';
	}
}

export function getNotificationPresentation(
	action: NotificationAction,
	metadata: Record<string, unknown> = {}
): { title: string; body?: string } {
	switch (action) {
		case NOTIFICATION_ACTIONS.TEAM_INVITATION_RECEIVED:
			return {
				title: 'Workspace invitation',
				body:
					typeof metadata.detail === 'string'
						? metadata.detail
						: 'You have been invited to join a workspace.'
			};
		case NOTIFICATION_ACTIONS.TEAM_INVITATION_ACCEPTED:
			return {
				title: 'Invitation accepted',
				body:
					typeof metadata.detail === 'string'
						? metadata.detail
						: 'Someone accepted your workspace invitation.'
			};
		case NOTIFICATION_ACTIONS.TEAM_MEMBER_ROLE_CHANGED:
			return {
				title: 'Your role was updated',
				body:
					typeof metadata.detail === 'string'
						? metadata.detail
						: 'Your workspace role has changed.'
			};
		case NOTIFICATION_ACTIONS.TEAM_MEMBER_REMOVED:
			return {
				title: 'Removed from workspace',
				body:
					typeof metadata.detail === 'string'
						? metadata.detail
						: 'You were removed from a workspace.'
			};
		case NOTIFICATION_ACTIONS.SECURITY_UNUSUAL_LOGIN:
			return {
				title: 'Unusual sign-in detected',
				body:
					typeof metadata.detail === 'string'
						? metadata.detail
						: 'Your account signed in from a network that has not been used recently.'
			};
		case NOTIFICATION_ACTIONS.SECURITY_PASSWORD_CHANGED:
			return {
				title: 'Password changed',
				body: 'Your account password was updated successfully.'
			};
		case NOTIFICATION_ACTIONS.SECURITY_PASSWORD_RESET_COMPLETED:
			return {
				title: 'Password reset completed',
				body: 'Your account password was reset successfully.'
			};
		default:
			return {
				title: 'Notification',
				body: typeof metadata.detail === 'string' ? metadata.detail : undefined
			};
	}
}
