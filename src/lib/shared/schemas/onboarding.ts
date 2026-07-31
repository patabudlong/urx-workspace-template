import { z } from 'zod';
import { WORKSPACE_COUNTRIES, WORKSPACE_TEAM_SIZE_VALUES } from '$lib/shared/workspace-constants';
import { isValidWorkspaceSlug, slugifyWorkspaceName } from '$lib/shared/workspace-slug';

const workspaceNameSchema = z
	.string()
	.trim()
	.min(2, 'Workspace name must be at least 2 characters.')
	.max(120, 'Workspace name must be at most 120 characters.');

const workspaceSlugSchema = z
	.string()
	.trim()
	.transform((value) => slugifyWorkspaceName(value))
	.refine((value) => isValidWorkspaceSlug(value), {
		message: 'Workspace URL must be 2–48 characters using lowercase letters, numbers, and hyphens.'
	});

const workspaceSlugClientSchema = z
	.string()
	.trim()
	.refine((value) => !value || isValidWorkspaceSlug(value), {
		message: 'Workspace URL must be 2–48 characters using lowercase letters, numbers, and hyphens.'
	});

const contactPhoneSchema = z
	.string()
	.trim()
	.min(7, 'Enter a valid contact number.')
	.max(32, 'Contact number is too long.')
	.refine((value) => /^\+\d{1,4}\s+\S/.test(value), {
		message: 'Enter a valid contact number with country code.'
	});

const addressLineSchema = z.string().trim().min(1, 'This field is required.').max(200);

const optionalWebsiteSchema = z
	.string()
	.trim()
	.max(200)
	.transform((value) => (value ? value : undefined))
	.refine((value) => !value || /^https?:\/\/.+/i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(value), {
		message: 'Enter a valid website URL.'
	})
	.transform((value) => {
		if (!value) {
			return undefined;
		}

		return /^https?:\/\//i.test(value) ? value : `https://${value}`;
	});

const optionalWebsiteClientSchema = z
	.string()
	.trim()
	.max(200)
	.refine(
		(value) => !value || /^https?:\/\/.+/i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(value),
		{
			message: 'Enter a valid website URL.'
		}
	);

export const ownerOnboardingSchema = z.object({
	name: workspaceNameSchema,
	slug: workspaceSlugSchema,
	contactPhone: contactPhoneSchema,
	teamSize: z.enum(WORKSPACE_TEAM_SIZE_VALUES as [string, ...string[]], {
		error: 'Select your team size.'
	}),
	addressLine1: addressLineSchema,
	addressLine2: z.string().trim().max(200).optional(),
	city: addressLineSchema,
	region: z.string().trim().max(120).optional(),
	postalCode: z.string().trim().max(32).optional(),
	country: z.enum(WORKSPACE_COUNTRIES as unknown as [string, ...string[]], {
		error: 'Select a country.'
	}),
	website: optionalWebsiteSchema
});

export const ownerOnboardingClientSchema = z.object({
	name: workspaceNameSchema,
	slug: workspaceSlugClientSchema,
	contactPhone: contactPhoneSchema,
	teamSize: z.enum(WORKSPACE_TEAM_SIZE_VALUES as [string, ...string[]], {
		error: 'Select your team size.'
	}),
	addressLine1: addressLineSchema,
	addressLine2: z.string().trim().max(200).optional(),
	city: addressLineSchema,
	region: z.string().trim().max(120).optional(),
	postalCode: z.string().trim().max(32).optional(),
	country: z.enum(WORKSPACE_COUNTRIES as unknown as [string, ...string[]], {
		error: 'Select a country.'
	}),
	website: optionalWebsiteClientSchema
});

export const memberOnboardingSchema = z.object({
	workspaceRef: z
		.string()
		.trim()
		.min(2, 'Enter a workspace slug or ID.')
		.max(64, 'Workspace reference is too long.')
});

export const memberOnboardingClientSchema = memberOnboardingSchema;

export type OwnerOnboardingInput = z.infer<typeof ownerOnboardingSchema>;
export type MemberOnboardingInput = z.infer<typeof memberOnboardingSchema>;
