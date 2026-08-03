import { z } from 'zod';

const personNameSchema = z
	.string()
	.trim()
	.min(1, 'This field is required')
	.max(60, 'Must be 60 characters or fewer');

export const updateProfileSchema = z.object({
	firstName: personNameSchema,
	lastName: personNameSchema
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type UserProfile = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
	emailVerified: boolean;
	hasGoogleAccount: boolean;
	createdAt: string;
};
