import { z } from 'zod';
import { isPasswordStrong } from '$lib/shared/password-policy';

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Current password is required'),
	newPassword: z
		.string()
		.min(1, 'New password is required')
		.refine(isPasswordStrong, 'Password does not meet all requirements')
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type SecurityProfile = {
	hasAppPassword: boolean;
	hasGoogleAccount: boolean;
	passwordChangedAt: string | null;
};
