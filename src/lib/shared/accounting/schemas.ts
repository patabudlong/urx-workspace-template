import { z } from 'zod';

export const ACCOUNTING_JURISDICTIONS = ['PH'] as const;
export type AccountingJurisdiction = (typeof ACCOUNTING_JURISDICTIONS)[number];

export const FISCAL_MONTHS = [
	{ value: 1, label: 'January' },
	{ value: 2, label: 'February' },
	{ value: 3, label: 'March' },
	{ value: 4, label: 'April' },
	{ value: 5, label: 'May' },
	{ value: 6, label: 'June' },
	{ value: 7, label: 'July' },
	{ value: 8, label: 'August' },
	{ value: 9, label: 'September' },
	{ value: 10, label: 'October' },
	{ value: 11, label: 'November' },
	{ value: 12, label: 'December' }
] as const;

export const accountingSettingsSchema = z.object({
	companyName: z.string().trim().min(1, 'Company name is required').max(200),
	tin: z
		.string()
		.trim()
		.max(32)
		.optional()
		.transform((value) => value || ''),
	addressLine1: z.string().trim().max(200).optional().default(''),
	addressLine2: z.string().trim().max(200).optional().default(''),
	city: z.string().trim().max(120).optional().default(''),
	province: z.string().trim().max(120).optional().default(''),
	fiscalYearStartMonth: z.coerce.number().int().min(1).max(12),
	timezone: z.string().trim().min(1).max(64),
	baseCurrency: z.literal('PHP')
});

export type AccountingSettingsInput = z.infer<typeof accountingSettingsSchema>;

export function createAccountingSettingsDefaults(input?: {
	timezone?: string;
}): AccountingSettingsInput {
	return {
		companyName: '',
		tin: '',
		addressLine1: '',
		addressLine2: '',
		city: '',
		province: '',
		fiscalYearStartMonth: 1,
		timezone: input?.timezone ?? 'Asia/Manila',
		baseCurrency: 'PHP'
	};
}

export const closePeriodSchema = z.object({
	periodId: z.string().trim().min(1)
});

export const journalFormSchema = z.object({
	periodId: z.string().trim().min(1),
	entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	reference: z.string().trim().max(64).optional().default(''),
	memo: z.string().trim().max(1000).optional().default(''),
	lines: z
		.array(
			z.object({
				accountId: z.string().optional().default(''),
				description: z.string().trim().max(500).optional().default(''),
				debit: z.string().optional().default(''),
				credit: z.string().optional().default('')
			})
		)
		.min(2)
});
