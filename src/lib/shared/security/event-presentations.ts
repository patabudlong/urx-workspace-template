import {
	SECURITY_EVENT_ACTIONS,
	type SecurityEventAction,
	type SecurityEventCategory,
	type SecurityEventSeverity
} from '$lib/shared/models/security-event';

export type SecurityEventPresentation = {
	title: string;
	description?: string;
};

const ACTION_PRESENTATIONS: Record<SecurityEventAction, SecurityEventPresentation> = {
	[SECURITY_EVENT_ACTIONS.LOGIN_SUCCESS]: {
		title: 'Signed in',
		description: 'A successful sign-in to this account.'
	},
	[SECURITY_EVENT_ACTIONS.LOGIN_FAILED]: {
		title: 'Failed sign-in attempt',
		description: 'Someone entered an incorrect password or email.'
	},
	[SECURITY_EVENT_ACTIONS.LOGOUT]: {
		title: 'Signed out',
		description: 'This account was signed out.'
	},
	[SECURITY_EVENT_ACTIONS.TWO_FACTOR_CHALLENGE]: {
		title: 'Two-factor verification required',
		description: 'Sign-in paused until a verification code is entered.'
	},
	[SECURITY_EVENT_ACTIONS.TWO_FACTOR_SUCCESS]: {
		title: 'Two-factor verification passed',
		description: 'Sign-in completed after two-factor verification.'
	},
	[SECURITY_EVENT_ACTIONS.TWO_FACTOR_FAILED]: {
		title: 'Two-factor verification failed',
		description: 'An invalid verification code was entered.'
	},
	[SECURITY_EVENT_ACTIONS.PASSWORD_RESET_REQUESTED]: {
		title: 'Password reset requested',
		description: 'A password reset email was sent for this account.'
	},
	[SECURITY_EVENT_ACTIONS.PASSWORD_RESET_COMPLETED]: {
		title: 'Password reset completed',
		description: 'The account password was changed via a reset link.'
	},
	[SECURITY_EVENT_ACTIONS.PASSWORD_CHANGED]: {
		title: 'Password changed',
		description: 'The account password was updated from security settings.'
	},
	[SECURITY_EVENT_ACTIONS.TWO_FACTOR_ENABLED]: {
		title: 'Two-factor authentication enabled',
		description: 'An extra sign-in step was turned on for this account.'
	},
	[SECURITY_EVENT_ACTIONS.TWO_FACTOR_DISABLED]: {
		title: 'Two-factor authentication disabled',
		description: 'The extra sign-in step was turned off for this account.'
	},
	[SECURITY_EVENT_ACTIONS.TRUSTED_DEVICE_REVOKED]: {
		title: 'Trusted device removed',
		description: 'A remembered device was removed from this account.'
	},
	[SECURITY_EVENT_ACTIONS.BACKUP_CODES_REGENERATED]: {
		title: 'Backup codes regenerated',
		description: 'New two-factor backup codes were created.'
	},
	[SECURITY_EVENT_ACTIONS.MEMBER_ROLE_CHANGED]: {
		title: 'Member role updated',
		description: 'A workspace member role was changed.'
	},
	[SECURITY_EVENT_ACTIONS.MEMBER_REMOVED]: {
		title: 'Member removed',
		description: 'A member was removed from the workspace.'
	},
	[SECURITY_EVENT_ACTIONS.INVITATION_SENT]: {
		title: 'Invitation sent',
		description: 'A teammate was invited to join the workspace.'
	},
	[SECURITY_EVENT_ACTIONS.INVITATION_ACCEPTED]: {
		title: 'Invitation accepted',
		description: 'An invited teammate joined the workspace.'
	},
	[SECURITY_EVENT_ACTIONS.INVITATION_REVOKED]: {
		title: 'Invitation revoked',
		description: 'A pending workspace invitation was cancelled.'
	},
	[SECURITY_EVENT_ACTIONS.WORKSPACE_SETTINGS_UPDATED]: {
		title: 'Workspace settings updated',
		description: 'Workspace name or branding was changed.'
	},
	[SECURITY_EVENT_ACTIONS.WORKSPACE_APPROVED]: {
		title: 'Workspace approved',
		description: 'A workspace request was approved by platform staff.'
	},
	[SECURITY_EVENT_ACTIONS.WORKSPACE_REJECTED]: {
		title: 'Workspace rejected',
		description: 'A workspace request was rejected by platform staff.'
	}
};

const CATEGORY_LABELS: Record<SecurityEventCategory, string> = {
	auth: 'Sign-in',
	account: 'Account',
	workspace: 'Workspace',
	platform: 'Platform'
};

const SEVERITY_LABELS: Record<SecurityEventSeverity, string> = {
	info: 'Info',
	warning: 'Warning',
	critical: 'Critical'
};

export function getSecurityEventPresentation(
	action: SecurityEventAction,
	metadata: Record<string, unknown> = {}
): SecurityEventPresentation {
	const base = ACTION_PRESENTATIONS[action];
	const detail = typeof metadata.detail === 'string' ? metadata.detail : undefined;

	if (detail) {
		return {
			title: base.title,
			description: detail
		};
	}

	return base;
}

export function getSecurityEventCategoryLabel(category: SecurityEventCategory): string {
	return CATEGORY_LABELS[category];
}

export function getSecurityEventSeverityLabel(severity: SecurityEventSeverity): string {
	return SEVERITY_LABELS[severity];
}
