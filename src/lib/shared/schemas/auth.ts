import { z } from 'zod';
import { isPasswordStrong } from '$lib/shared/password-policy';
import { recaptchaTokenSchema } from '$lib/shared/recaptcha';

export const loginSchema = z.object({
	email: z.email('Enter a valid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	recaptchaToken: recaptchaTokenSchema
});

export type LoginInput = z.infer<typeof loginSchema>;

const personNameSchema = z
	.string()
	.trim()
	.min(1, 'This field is required')
	.max(60, 'Must be 60 characters or fewer');

export const signupSchema = z.object({
	firstName: personNameSchema,
	lastName: personNameSchema,
	email: z.email('Enter a valid email address'),
	password: z
		.string()
		.min(1, 'Password is required')
		.refine(isPasswordStrong, 'Password does not meet all requirements'),
	recaptchaToken: recaptchaTokenSchema
});

export type SignupInput = z.infer<typeof signupSchema>;

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
