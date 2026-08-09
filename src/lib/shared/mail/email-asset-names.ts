export const EMAIL_ASSET_PREFIX = 'email';

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
	messages: 'messages.png'
} as const;

export type EmailAssetName = (typeof EMAIL_ASSETS)[keyof typeof EMAIL_ASSETS];
