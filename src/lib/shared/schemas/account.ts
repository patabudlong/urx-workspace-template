import { z } from 'zod';
import { isE164PhoneNumber, normalizePhoneNumber } from '$lib/shared/phone';

const personNameSchema = z
	.string()
	.trim()
	.min(1, 'This field is required')
	.max(60, 'Must be 60 characters or fewer');

const phoneNumberInputSchema = z
	.string()
	.trim()
	.transform(normalizePhoneNumber)
	.refine(
		(value) => value === '' || isE164PhoneNumber(value),
		'Enter a valid number with country code (e.g. +639171234567)'
	);

export const updateProfileSchema = z.object({
	firstName: personNameSchema,
	lastName: personNameSchema
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updatePhoneNumberSchema = z.object({
	phoneNumber: phoneNumberInputSchema
});

export type UpdatePhoneNumberInput = z.infer<typeof updatePhoneNumberSchema>;

export const verifyPhoneSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'Verification code is required')
		.regex(/^\d{6}$/, 'Enter the 6-digit code from your SMS')
});

export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;

export type UserProfile = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
	phoneNumber: string | null;
	phoneVerified: boolean;
	emailVerified: boolean;
	hasGoogleAccount: boolean;
	createdAt: string;
};
