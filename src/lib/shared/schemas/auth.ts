import { z } from 'zod';
import { isPasswordStrong } from '$lib/shared/password-policy';
import { recaptchaTokenSchema } from '$lib/shared/recaptcha';

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, 'Email is required')
		.pipe(z.email('Enter a valid email address')),
	password: z
		.string()
		.min(1, 'Password is required')
		.refine((value) => value.length >= 8, 'Password must be at least 8 characters'),
	recaptchaToken: recaptchaTokenSchema
});

/** Client-side fields only — reCAPTCHA is injected on submit after this passes. */
export const loginClientSchema = loginSchema.omit({ recaptchaToken: true });

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginClientInput = z.infer<typeof loginClientSchema>;

const personNameSchema = z
	.string()
	.trim()
	.min(1, 'This field is required')
	.max(60, 'Must be 60 characters or fewer');

export const signupSchema = z.object({
	firstName: personNameSchema,
	lastName: personNameSchema,
	email: z
		.string()
		.min(1, 'Email is required')
		.pipe(z.email('Enter a valid email address')),
	password: z
		.string()
		.min(1, 'Password is required')
		.refine(isPasswordStrong, 'Password does not meet all requirements'),
	acceptedTerms: z
		.boolean()
		.refine((value) => value, 'You must agree to the Terms of Service and Privacy Notice'),
	recaptchaToken: recaptchaTokenSchema
});

/** Client-side fields only — reCAPTCHA is injected on submit after this passes. */
export const signupClientSchema = signupSchema.omit({ recaptchaToken: true });

export type SignupInput = z.infer<typeof signupSchema>;
export type SignupClientInput = z.infer<typeof signupClientSchema>;

export type AuthUser = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
};

export type LoginSuccessData = {
	accessToken: string;
	tokenType: 'Bearer';
	expiresIn: number;
	user: AuthUser;
};

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.min(1, 'Email is required')
		.pipe(z.email('Enter a valid email address')),
	recaptchaToken: recaptchaTokenSchema
});

export const forgotPasswordClientSchema = forgotPasswordSchema.omit({ recaptchaToken: true });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ForgotPasswordClientInput = z.infer<typeof forgotPasswordClientSchema>;

export const resetPasswordSchema = z.object({
	token: z.string().min(1, 'Reset link is invalid or expired'),
	password: z
		.string()
		.min(1, 'Password is required')
		.refine(isPasswordStrong, 'Password does not meet all requirements'),
	recaptchaToken: recaptchaTokenSchema
});

export const resetPasswordClientSchema = resetPasswordSchema.omit({ recaptchaToken: true });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordClientInput = z.infer<typeof resetPasswordClientSchema>;
