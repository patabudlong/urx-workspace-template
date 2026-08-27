import { z } from 'zod';
import { CRM_DEAL_STAGES } from '$lib/shared/models/crm-deal';

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

export const crmListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: optionalTrimmedString
});

export const createCrmContactSchema = z.object({
	firstName: z.string().trim().min(1, 'First name is required').max(100),
	lastName: z.string().trim().min(1, 'Last name is required').max(100),
	email: z
		.string()
		.trim()
		.email('Enter a valid email address')
		.optional()
		.or(z.literal(''))
		.transform((value) => (value ? value : null)),
	phone: nullableTrimmedString,
	title: nullableTrimmedString,
	companyId: nullableTrimmedString,
	notes: nullableTrimmedString
});

export const createCrmCompanySchema = z.object({
	name: z.string().trim().min(1, 'Company name is required').max(200),
	domain: nullableTrimmedString,
	industry: nullableTrimmedString,
	phone: nullableTrimmedString,
	notes: nullableTrimmedString
});

export const createCrmDealSchema = z.object({
	title: z.string().trim().min(1, 'Deal title is required').max(200),
	stage: z.enum([
		CRM_DEAL_STAGES.LEAD,
		CRM_DEAL_STAGES.QUALIFIED,
		CRM_DEAL_STAGES.PROPOSAL,
		CRM_DEAL_STAGES.NEGOTIATION,
		CRM_DEAL_STAGES.WON,
		CRM_DEAL_STAGES.LOST
	]).default(CRM_DEAL_STAGES.LEAD),
	value: z.coerce.number().nonnegative().optional().nullable(),
	currency: z.string().trim().length(3).default('PHP'),
	contactId: nullableTrimmedString,
	companyId: nullableTrimmedString,
	expectedCloseDate: z
		.string()
		.trim()
		.optional()
		.transform((value) => (value && value.length > 0 ? value : null)),
	notes: nullableTrimmedString
});

export type CreateCrmContactInput = z.infer<typeof createCrmContactSchema>;
export type CreateCrmCompanyInput = z.infer<typeof createCrmCompanySchema>;
export type CreateCrmDealInput = z.infer<typeof createCrmDealSchema>;

const optionalFormString = z.string().trim().optional();

export const crmContactFormDefaults = {
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	title: '',
	companyId: '',
	notes: ''
} as const;

export const crmContactFormSchema = z.object({
	firstName: z.string().trim().min(1, 'First name is required').max(100),
	lastName: z.string().trim().min(1, 'Last name is required').max(100),
	email: z
		.string()
		.trim()
		.optional()
		.refine((value) => !value || z.email().safeParse(value).success, 'Enter a valid email address'),
	phone: optionalFormString,
	title: optionalFormString,
	companyId: optionalFormString,
	notes: optionalFormString
});

export const crmCompanyFormDefaults = {
	name: '',
	domain: '',
	industry: '',
	phone: '',
	notes: ''
} as const;

export const crmCompanyFormSchema = z.object({
	name: z.string().trim().min(1, 'Company name is required').max(200),
	domain: optionalFormString,
	industry: optionalFormString,
	phone: optionalFormString,
	notes: optionalFormString
});

export const crmDealFormDefaults = {
	title: '',
	stage: CRM_DEAL_STAGES.LEAD,
	value: '',
	currency: 'PHP',
	contactId: '',
	companyId: '',
	expectedCloseDate: '',
	notes: ''
} as const;

export const crmDealFormSchema = z.object({
	title: z.string().trim().min(1, 'Deal title is required').max(200),
	stage: z.enum([
		CRM_DEAL_STAGES.LEAD,
		CRM_DEAL_STAGES.QUALIFIED,
		CRM_DEAL_STAGES.PROPOSAL,
		CRM_DEAL_STAGES.NEGOTIATION,
		CRM_DEAL_STAGES.WON,
		CRM_DEAL_STAGES.LOST
	]),
	value: optionalFormString,
	currency: z.string().trim().length(3, 'Currency must be a 3-letter code'),
	contactId: optionalFormString,
	companyId: optionalFormString,
	expectedCloseDate: optionalFormString,
	notes: optionalFormString
});

export const updateCrmDealSchema = z.object({
	stage: z
		.enum([
			CRM_DEAL_STAGES.LEAD,
			CRM_DEAL_STAGES.QUALIFIED,
			CRM_DEAL_STAGES.PROPOSAL,
			CRM_DEAL_STAGES.NEGOTIATION,
			CRM_DEAL_STAGES.WON,
			CRM_DEAL_STAGES.LOST
		])
		.optional(),
	value: z.coerce.number().nonnegative().optional().nullable(),
	currency: z.string().trim().length(3).optional(),
	notes: z.string().trim().optional().nullable(),
	expectedCloseDate: z.string().trim().optional().nullable()
});

export const crmDealStageFormSchema = z.object({
	stage: z.enum([
		CRM_DEAL_STAGES.LEAD,
		CRM_DEAL_STAGES.QUALIFIED,
		CRM_DEAL_STAGES.PROPOSAL,
		CRM_DEAL_STAGES.NEGOTIATION,
		CRM_DEAL_STAGES.WON,
		CRM_DEAL_STAGES.LOST
	])
});

export type CrmContactFormInput = z.infer<typeof crmContactFormSchema>;
export type CrmCompanyFormInput = z.infer<typeof crmCompanyFormSchema>;
export type CrmDealFormInput = z.infer<typeof crmDealFormSchema>;
export type UpdateCrmDealInput = z.infer<typeof updateCrmDealSchema>;

export function mapCrmContactFormToCreateInput(data: CrmContactFormInput): CreateCrmContactInput {
	return {
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email && data.email.length > 0 ? data.email : null,
		phone: data.phone && data.phone.length > 0 ? data.phone : null,
		title: data.title && data.title.length > 0 ? data.title : null,
		companyId: data.companyId && data.companyId.length > 0 ? data.companyId : null,
		notes: data.notes && data.notes.length > 0 ? data.notes : null
	};
}

export function mapCrmCompanyFormToCreateInput(data: CrmCompanyFormInput): CreateCrmCompanyInput {
	return {
		name: data.name,
		domain: data.domain && data.domain.length > 0 ? data.domain : null,
		industry: data.industry && data.industry.length > 0 ? data.industry : null,
		phone: data.phone && data.phone.length > 0 ? data.phone : null,
		notes: data.notes && data.notes.length > 0 ? data.notes : null
	};
}

export function mapCrmDealFormToCreateInput(data: CrmDealFormInput): CreateCrmDealInput {
	const parsedValue =
		data.value && data.value.trim().length > 0 ? Number.parseFloat(data.value) : null;

	return {
		title: data.title,
		stage: data.stage,
		value: parsedValue !== null && Number.isFinite(parsedValue) ? parsedValue : null,
		currency: data.currency,
		contactId: data.contactId && data.contactId.length > 0 ? data.contactId : null,
		companyId: data.companyId && data.companyId.length > 0 ? data.companyId : null,
		expectedCloseDate:
			data.expectedCloseDate && data.expectedCloseDate.length > 0 ? data.expectedCloseDate : null,
		notes: data.notes && data.notes.length > 0 ? data.notes : null
	};
}
