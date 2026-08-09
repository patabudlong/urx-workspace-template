import { z } from 'zod';
import { isPasswordStrong } from '$lib/shared/password-policy';
import { TWO_FACTOR_METHODS } from '$lib/shared/models/two-factor';

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Current password is required'),
	newPassword: z
		.string()
		.min(1, 'New password is required')
		.refine(isPasswordStrong, 'Password does not meet all requirements')
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

const verificationCodeSchema = z
	.string()
	.min(1, 'Verification code is required')
	.max(16, 'Verification code is too long');

export const twoFactorVerifyCodeSchema = z.object({
	code: verificationCodeSchema
});

export const twoFactorSetupTotpConfirmSchema = twoFactorVerifyCodeSchema;

export const twoFactorSetupOtpConfirmSchema = z.object({
	code: z
		.string()
		.min(1, 'Verification code is required')
		.regex(/^\d{6}$/, 'Enter the 6-digit code')
});

const sensitiveActionMethodSchema = z.enum(['totp', 'backup']);

export const twoFactorDisableSchema = z.object({
	password: z.string().optional(),
	code: z.string().optional(),
	method: sensitiveActionMethodSchema.optional()
});

export const twoFactorDisableWithPasswordSchema = z.object({
	password: z.string().min(1, 'Password is required'),
	code: z.string().optional(),
	method: sensitiveActionMethodSchema.optional()
});

export const twoFactorDisableWithCodeSchema = z.object({
	password: z.string().optional(),
	code: z.string().min(1, 'Verification code is required'),
	method: sensitiveActionMethodSchema.optional()
});

export const twoFactorRegenerateBackupCodesSchema = z.object({
	password: z.string().optional(),
	code: z.string().optional(),
	method: z.enum(['totp']).optional()
});

export const twoFactorRegenerateBackupCodesWithPasswordSchema = z.object({
	password: z.string().min(1, 'Password is required'),
	code: z.string().optional(),
	method: z.enum(['totp']).optional()
});

export const twoFactorRegenerateBackupCodesWithCodeSchema = z.object({
	password: z.string().optional(),
	code: z.string().min(1, 'Verification code is required'),
	method: z.enum(['totp']).optional()
});

export const twoFactorLoginChallengeSchema = z.object({
	method: z.enum([
		TWO_FACTOR_METHODS.TOTP,
		TWO_FACTOR_METHODS.SMS,
		TWO_FACTOR_METHODS.EMAIL,
		TWO_FACTOR_METHODS.BACKUP
	]),
	code: z.string().min(1, 'Verification code is required'),
	rememberDevice: z.boolean().optional()
});

export type TwoFactorLoginChallengeInput = z.infer<typeof twoFactorLoginChallengeSchema>;

export type TrustedDeviceSummary = {
	id: string;
	label: string | null;
	createdAt: string;
	expiresAt: string;
};

export type TwoFactorSecurityProfile = {
	enabled: boolean;
	methods: Array<'totp' | 'sms' | 'email'>;
	hasBackupCodes: boolean;
	backupCodesRemaining: number;
	trustedDevices: TrustedDeviceSummary[];
	smsAvailable: boolean;
	emailAvailable: boolean;
	totpEnabled: boolean;
	smsEnabled: boolean;
	emailEnabled: boolean;
};

export type SecurityProfile = {
	hasAppPassword: boolean;
	hasGoogleAccount: boolean;
	passwordChangedAt: string | null;
	twoFactor: TwoFactorSecurityProfile;
};
