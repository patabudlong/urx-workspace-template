export const SECURITY_EMAIL_LEVELS = {
	WARNING: 'warning',
	ALERT: 'alert'
} as const;

export type SecurityEmailLevel = (typeof SECURITY_EMAIL_LEVELS)[keyof typeof SECURITY_EMAIL_LEVELS];

export const SECURITY_EMAIL_KINDS = {
	UNUSUAL_LOGIN: 'unusual_login',
	PASSWORD_CHANGED: 'password_changed',
	PASSWORD_RESET_COMPLETED: 'password_reset_completed',
	TWO_FACTOR_DISABLED: 'two_factor_disabled'
} as const;

export type SecurityEmailKind = (typeof SECURITY_EMAIL_KINDS)[keyof typeof SECURITY_EMAIL_KINDS];

export type SecurityEmailCopy = {
	title: string;
	preheader: string;
	paragraphs: string[];
	subject: string;
	ctaLabel: string;
};

export function resolveSecurityEmailCopy(input: {
	level: SecurityEmailLevel;
	kind: SecurityEmailKind;
}): SecurityEmailCopy {
	if (input.kind === SECURITY_EMAIL_KINDS.UNUSUAL_LOGIN) {
		return {
			subject: 'Unusual sign-in detected on your Urixoft account',
			title: 'Unusual sign-in detected',
			preheader: 'We noticed a sign-in to your account from a new network.',
			paragraphs: [
				'We detected a sign-in to your Urixoft Workspace account from a network that has not been used recently.',
				'If this was you, no action is needed. If you do not recognize this activity, secure your account right away.'
			],
			ctaLabel: 'Review security activity'
		};
	}

	if (input.kind === SECURITY_EMAIL_KINDS.PASSWORD_CHANGED) {
		return {
			subject: 'Security alert: your password was changed',
			title: 'Your password was changed',
			preheader: 'Your Urixoft Workspace password was updated from security settings.',
			paragraphs: [
				'Your Urixoft Workspace password was changed from your account security settings.',
				'If you made this change, you can ignore this message. Otherwise, reset your password immediately and review your account activity.'
			],
			ctaLabel: 'Secure your account'
		};
	}

	if (input.kind === SECURITY_EMAIL_KINDS.PASSWORD_RESET_COMPLETED) {
		return {
			subject: 'Security alert: your password was reset',
			title: 'Your password was reset',
			preheader: 'Your Urixoft Workspace password was reset using a recovery link.',
			paragraphs: [
				'Your Urixoft Workspace password was reset using a password recovery link.',
				'If you requested this reset, no further action is required. If you did not, secure your account immediately.'
			],
			ctaLabel: 'Secure your account'
		};
	}

	return {
		subject: 'Security alert: two-factor authentication disabled',
		title: 'Two-factor authentication disabled',
		preheader: 'Two-factor authentication was turned off on your Urixoft Workspace account.',
		paragraphs: [
			'Two-factor authentication was disabled on your Urixoft Workspace account.',
			'Your account now relies on your password or linked sign-in method only. If you did not make this change, secure your account immediately.'
		],
		ctaLabel: 'Secure your account'
	};
}
