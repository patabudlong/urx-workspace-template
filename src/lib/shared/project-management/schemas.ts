import { z } from 'zod';
import { PM_PROJECT_STATUSES } from '$lib/shared/models/pm-project';

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
	websiteUrl: nullableTrimmedString,
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
	websiteUrl: z.string().trim().optional().nullable(),
	dueDate: z.string().trim().optional().nullable(),
	notes: z.string().trim().optional().nullable()
});

export type CreatePmProjectInput = z.infer<typeof createPmProjectSchema>;
export type UpdatePmProjectInput = z.infer<typeof updatePmProjectSchema>;

const optionalFormString = z.string().trim().optional();

export const pmProjectFormDefaults = {
	title: '',
	description: '',
	status: PM_PROJECT_STATUSES.PLANNING,
	clientName: '',
	websiteUrl: '',
	dueDate: '',
	notes: ''
} as const;

export const pmProjectFormSchema = z.object({
	title: z.string().trim().min(1, 'Project title is required').max(200),
	description: optionalFormString,
	status: pmProjectStatusSchema,
	clientName: optionalFormString,
	websiteUrl: optionalFormString,
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
		websiteUrl: data.websiteUrl && data.websiteUrl.length > 0 ? data.websiteUrl : null,
		crmCompanyId: null,
		crmContactId: null,
		dueDate: data.dueDate && data.dueDate.length > 0 ? data.dueDate : null,
		notes: data.notes && data.notes.length > 0 ? data.notes : null
	};
}
