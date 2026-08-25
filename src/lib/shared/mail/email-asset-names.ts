export const EMAIL_ASSET_PREFIX = 'email';

/** Bump when replacing an asset on Linode (immutable cache). */
export const EMAIL_ASSET_CACHE_VERSIONS: Partial<Record<string, string>> = {
	'security-alert.png': '2'
};

export const EMAIL_ASSETS = {
	logo: 'urixoft-logo.png',
	logoWhite: 'urixoft-logo-white.png',
	verifyEmail: 'verify-email.png',
	forgotPassword: 'forgot-password.png',
	passwordSuccess: 'password-success.png',
	twoFactorCode: 'two-factor-code.png',
	twoFactorStatus: 'two-factor-status.png',
	teamInvitation: 'team-invitation.png',
	workspaceApproved: 'workspace-approved.png',
	workspaceRequestReview: 'workspace-request-review.png',
	messages: 'messages.png',
	securityAlert: 'security-alert.png'
} as const;

export type EmailAssetName = (typeof EMAIL_ASSETS)[keyof typeof EMAIL_ASSETS];
