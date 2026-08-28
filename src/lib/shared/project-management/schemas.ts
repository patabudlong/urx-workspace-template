import { z } from 'zod';
import type { PmProjectDto } from '$lib/shared/models/pm-project';
import { PM_PROJECT_STATUSES } from '$lib/shared/models/pm-project';
import {
	PM_ONBOARDING_DOMAIN_STATUSES,
	PM_ONBOARDING_HOSTING_PREFERENCES
} from '$lib/shared/models/pm-project-onboarding';
import { PM_PROJECT_TYPES } from '$lib/shared/project-management/project-types';

const optionalTrimmedString = z
	.string()
	.trim()
	.optional()
	.transform((value) => (value && value.length > 0 ? value : undefined));

const nullableTrimmedString = z
	.string()
	.trim()
	.optional()
	.transform((value) => (value && value.length > 0 ? value : null));

const pmProjectStatusSchema = z.enum([
	PM_PROJECT_STATUSES.PLANNING,
	PM_PROJECT_STATUSES.ACTIVE,
	PM_PROJECT_STATUSES.ON_HOLD,
	PM_PROJECT_STATUSES.COMPLETED,
	PM_PROJECT_STATUSES.CANCELLED
]);

const pmProjectTypeSchema = z.enum([
	PM_PROJECT_TYPES.WEBSITE,
	PM_PROJECT_TYPES.PROJECT,
	PM_PROJECT_TYPES.SOFTWARE,
	PM_PROJECT_TYPES.DEVELOPMENT,
	PM_PROJECT_TYPES.BRANDING,
	PM_PROJECT_TYPES.MARKETING,
	PM_PROJECT_TYPES.CONSULTING,
	PM_PROJECT_TYPES.OTHER
]);

function coerceProjectTypes(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((entry): entry is string => typeof entry === 'string');
	}

	if (typeof value === 'string' && value.length > 0) {
		return [value];
	}

	return [];
}

const pmProjectTypesSchema = z
	.preprocess(coerceProjectTypes, z.array(pmProjectTypeSchema).min(1, 'Select at least one project type'));

export const pmListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: optionalTrimmedString,
	status: pmProjectStatusSchema.optional()
});

export const createPmProjectSchema = z.object({
	title: z.string().trim().min(1, 'Project title is required').max(200),
	description: nullableTrimmedString,
	status: pmProjectStatusSchema.default(PM_PROJECT_STATUSES.PLANNING),
	clientName: nullableTrimmedString,
	projectTypes: pmProjectTypesSchema,
	projectUrl: nullableTrimmedString,
	crmCompanyId: nullableTrimmedString,
	crmContactId: nullableTrimmedString,
	dueDate: z
		.string()
		.trim()
		.optional()
		.transform((value) => (value && value.length > 0 ? value : null)),
	notes: nullableTrimmedString
});

export const updatePmProjectSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().optional().nullable(),
	status: pmProjectStatusSchema.optional(),
	clientName: z.string().trim().optional().nullable(),
	projectTypes: pmProjectTypesSchema.optional(),
	projectUrl: z.string().trim().optional().nullable(),
	dueDate: z.string().trim().optional().nullable(),
	notes: z.string().trim().optional().nullable()
});

export type CreatePmProjectInput = z.infer<typeof createPmProjectSchema>;
export type UpdatePmProjectInput = z.infer<typeof updatePmProjectSchema>;

const optionalFormString = z.string().trim().optional();

export const pmProjectFormDefaults: PmProjectFormInput = {
	title: '',
	description: '',
	status: PM_PROJECT_STATUSES.PLANNING,
	clientName: '',
	projectTypes: [PM_PROJECT_TYPES.PROJECT],
	projectUrl: '',
	dueDate: '',
	notes: ''
};

export const pmProjectFormSchema = z.object({
	title: z.string().trim().min(1, 'Project title is required').max(200),
	description: optionalFormString,
	status: pmProjectStatusSchema,
	clientName: optionalFormString,
	projectTypes: pmProjectTypesSchema,
	projectUrl: optionalFormString,
	dueDate: optionalFormString,
	notes: optionalFormString
});

export const pmProjectStatusFormSchema = z.object({
	status: pmProjectStatusSchema
});

export type PmProjectFormInput = z.infer<typeof pmProjectFormSchema>;

export function mapPmProjectFormToCreateInput(data: PmProjectFormInput): CreatePmProjectInput {
	return {
		title: data.title,
		description: data.description && data.description.length > 0 ? data.description : null,
		status: data.status,
		clientName: data.clientName && data.clientName.length > 0 ? data.clientName : null,
		projectTypes: data.projectTypes,
		projectUrl: data.projectUrl && data.projectUrl.length > 0 ? data.projectUrl : null,
		crmCompanyId: null,
		crmContactId: null,
		dueDate: data.dueDate && data.dueDate.length > 0 ? data.dueDate : null,
		notes: data.notes && data.notes.length > 0 ? data.notes : null
	};
}

export function mapPmProjectDtoToFormInput(project: PmProjectDto): PmProjectFormInput {
	return {
		title: project.title,
		description: project.description ?? '',
		status: project.status,
		clientName: project.clientName ?? '',
		projectTypes: [...project.projectTypes],
		projectUrl: project.projectUrl ?? '',
		dueDate: project.dueDate ? project.dueDate.slice(0, 10) : '',
		notes: project.notes ?? ''
	};
}

export function mapPmProjectFormToUpdateInput(data: PmProjectFormInput): UpdatePmProjectInput {
	return {
		title: data.title,
		description: data.description && data.description.length > 0 ? data.description : null,
		status: data.status,
		clientName: data.clientName && data.clientName.length > 0 ? data.clientName : null,
		projectTypes: data.projectTypes,
		projectUrl: data.projectUrl && data.projectUrl.length > 0 ? data.projectUrl : null,
		dueDate: data.dueDate && data.dueDate.length > 0 ? data.dueDate : null,
		notes: data.notes && data.notes.length > 0 ? data.notes : null
	};
}

export const pmClientInviteFormDefaults = {
	clientEmail: '',
	clientName: ''
} as const;

export const pmClientInviteFormSchema = z.object({
	clientEmail: z.string().trim().email('Enter a valid client email address'),
	clientName: z.string().trim().optional()
});

export const pmClientOnboardingFormDefaults = {
	contactName: '',
	contactEmail: '',
	businessName: '',
	projectGoals: '',
	pagesNeeded: '',
	brandNotes: '',
	domainStatus: PM_ONBOARDING_DOMAIN_STATUSES.NOT_SURE,
	hostingPreference: PM_ONBOARDING_HOSTING_PREFERENCES.NOT_SURE,
	additionalNotes: ''
} as const;

const pmOnboardingDomainStatusSchema = z.enum([
	PM_ONBOARDING_DOMAIN_STATUSES.HAVE_DOMAIN,
	PM_ONBOARDING_DOMAIN_STATUSES.NEED_HELP,
	PM_ONBOARDING_DOMAIN_STATUSES.NOT_SURE
]);

const pmOnboardingHostingPreferenceSchema = z.enum([
	PM_ONBOARDING_HOSTING_PREFERENCES.WE_HOST,
	PM_ONBOARDING_HOSTING_PREFERENCES.CLIENT_HOSTS,
	PM_ONBOARDING_HOSTING_PREFERENCES.NOT_SURE
]);

export const pmClientOnboardingFormSchema = z.object({
	contactName: z.string().trim().min(1, 'Contact name is required').max(120),
	contactEmail: z.string().trim().email('Enter a valid email address'),
	businessName: z.string().trim().min(1, 'Business name is required').max(200),
	projectGoals: z.string().trim().min(1, 'Tell us about your project goals').max(2000),
	pagesNeeded: z.string().trim().max(1000).optional(),
	brandNotes: z.string().trim().max(2000).optional(),
	domainStatus: pmOnboardingDomainStatusSchema.optional(),
	hostingPreference: pmOnboardingHostingPreferenceSchema.optional(),
	additionalNotes: z.string().trim().max(2000).optional()
});

export type PmClientInviteFormInput = z.infer<typeof pmClientInviteFormSchema>;
export type PmClientOnboardingFormInput = z.infer<typeof pmClientOnboardingFormSchema>;
