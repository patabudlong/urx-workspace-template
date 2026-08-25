import { z } from 'zod';
import {
	PAYROLL_CURRENCY_VALUES,
	resolvePayrollCurrency,
	type PayrollCurrency
} from '$lib/shared/payroll/currency';
import {
	PAY_FREQUENCIES,
	WEEK_START_DAYS,
	requiresPeriodAnchor,
	type WeekStartDay
} from '$lib/shared/payroll/frequency';
import { PAYROLL_PAY_TYPES } from '$lib/shared/payroll/pay-rate';
import {
	PAYROLL_DEDUCTION_KINDS,
	percentToBasisPoints
} from '$lib/shared/payroll/deductions';
import { dollarsToCents, centsToMajorUnits } from '$lib/shared/payroll/format';
import {
	PAYROLL_TIMEZONE_VALUES,
	resolvePayrollTimezone,
	type PayrollTimezone
} from '$lib/shared/payroll/timezone';

export const PAYROLL_RUN_STATUSES = ['draft', 'processing', 'completed', 'failed'] as const;

export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

const payrollDateInputSchema = z
	.string()
	.trim()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');

export const payrollRunsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type PayrollRunsQuery = z.infer<typeof payrollRunsQuerySchema>;

export const payrollEmployeesQuerySchema = payrollRunsQuerySchema;

export type PayrollEmployeesQuery = z.infer<typeof payrollEmployeesQuerySchema>;

export const createPayrollEmployeeSchema = z.object({
	firstName: z.string().trim().min(1, 'First name is required.').max(80),
	initialName: z.string().trim().max(80).optional().or(z.literal('')),
	lastName: z.string().trim().min(1, 'Last name is required.').max(80),
	email: z
		.string()
		.trim()
		.email('Enter a valid email address.')
		.optional()
		.or(z.literal('')),
	jobTitle: z.string().trim().max(120).optional().or(z.literal('')),
	department: z.string().trim().max(120).optional().or(z.literal('')),
	tin: z
		.string()
		.trim()
		.max(20, 'TIN must be 20 characters or fewer.')
		.optional()
		.or(z.literal('')),
	employeeCode: z
		.string()
		.trim()
		.max(40, 'Employee code must be 40 characters or fewer.')
		.optional()
		.or(z.literal('')),
	payType: z.enum(PAYROLL_PAY_TYPES),
	payRate: z.coerce.number().min(0, 'Pay rate must be zero or greater.'),
	deductions: z
		.array(
			z.object({
				typeId: z.string().trim().min(1),
				enabled: z.coerce.boolean(),
				amount: z.coerce.number().min(0).default(0),
				ratePercent: z.coerce.number().min(0).max(100).default(0)
			})
		)
		.default([]),
	workScheduleId: z.string().trim().optional().or(z.literal(''))
});

export type CreatePayrollEmployeeInput = z.infer<typeof createPayrollEmployeeSchema>;

export const updatePayrollEmployeeSchema = createPayrollEmployeeSchema;

export type UpdatePayrollEmployeeInput = CreatePayrollEmployeeInput;

function isValidObjectIdString(value: string): boolean {
	return /^[a-f\d]{24}$/i.test(value);
}

export const payrollEmployeeIdParamSchema = z.object({
	id: z
		.string()
		.trim()
		.min(1, 'Employee id is required.')
		.refine(isValidObjectIdString, 'Invalid employee id.')
});

export const payrollRunIdParamSchema = z.object({
	id: z
		.string()
		.trim()
		.min(1, 'Pay run id is required.')
		.refine(isValidObjectIdString, 'Invalid pay run id.')
});

export const payrollPayslipIdParamSchema = z.object({
	id: z
		.string()
		.trim()
		.min(1, 'Payslip id is required.')
		.refine(isValidObjectIdString, 'Invalid payslip id.')
});

export const payrollPayslipsQuerySchema = payrollRunsQuerySchema;

export type PayrollPayslipsQuery = z.infer<typeof payrollPayslipsQuerySchema>;

export const createPayrollEmployeeDefaults: CreatePayrollEmployeeInput = {
	firstName: '',
	initialName: '',
	lastName: '',
	email: '',
	jobTitle: '',
	department: '',
	tin: '',
	employeeCode: '',
	payType: 'monthly',
	payRate: 0,
	deductions: [],
	workScheduleId: ''
};

export const createPayrollRunSchema = z
	.object({
		title: z.string().trim().min(1, 'Title is required.').max(120),
		periodStart: payrollDateInputSchema,
		periodEnd: payrollDateInputSchema
	})
	.refine((data) => data.periodEnd >= data.periodStart, {
		message: 'End date must be on or after the start date.',
		path: ['periodEnd']
	});

export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;

export const createPayrollRunDefaults: CreatePayrollRunInput = {
	title: '',
	periodStart: '',
	periodEnd: ''
};

export const payrollSettingsSchema = z
	.object({
		payFrequency: z.enum(PAY_FREQUENCIES),
		timezone: z.enum(PAYROLL_TIMEZONE_VALUES),
		currency: z.enum(PAYROLL_CURRENCY_VALUES),
		weekStartDay: z.enum(WEEK_START_DAYS).optional().or(z.literal('')),
		periodAnchorDate: payrollDateInputSchema.optional().or(z.literal('')),
		registeredCompanyName: z.string().trim().max(160).optional().or(z.literal('')),
		showYtdTotals: z.coerce.boolean().default(false)
	})
	.superRefine((data, ctx) => {
		if (!requiresPeriodAnchor(data.payFrequency)) {
			return;
		}

		if (!data.periodAnchorDate) {
			ctx.addIssue({
				code: 'custom',
				message: 'Period anchor date is required.',
				path: ['periodAnchorDate']
			});
		}

		if (!data.weekStartDay) {
			ctx.addIssue({
				code: 'custom',
				message: 'Week start day is required.',
				path: ['weekStartDay']
			});
		}
	});

export type PayrollSettingsInput = z.infer<typeof payrollSettingsSchema>;

export function createPayrollSettingsDefaults(input: {
	timezone: PayrollTimezone;
	currency: PayrollCurrency;
}): PayrollSettingsInput {
	return {
		payFrequency: 'semi-monthly',
		timezone: resolvePayrollTimezone(input.timezone),
		currency: resolvePayrollCurrency(input.currency),
		weekStartDay: 'monday' satisfies WeekStartDay,
		periodAnchorDate: '',
		registeredCompanyName: '',
		showYtdTotals: false
	};
}

const payrollDeductionTypeInputSchema = z.object({
	id: z.string().trim().min(1).max(64),
	name: z.string().trim().min(1, 'Name is required.').max(80),
	kind: z.enum(PAYROLL_DEDUCTION_KINDS),
	defaultAmount: z.coerce.number().min(0, 'Amount must be zero or greater.'),
	defaultRatePercent: z.coerce
		.number()
		.min(0, 'Rate must be zero or greater.')
		.max(100, 'Rate cannot exceed 100%.'),
	isActive: z.coerce.boolean()
});

export const payrollDeductionTypesSchema = z.object({
	types: z.array(payrollDeductionTypeInputSchema).max(30, 'Too many deduction types.')
});

export type PayrollDeductionTypesInput = z.infer<typeof payrollDeductionTypesSchema>;

export function mapDeductionTypesInputToDocument(
	input: PayrollDeductionTypesInput['types'],
	currency: PayrollCurrency = 'PHP'
): import('$lib/shared/payroll/deductions').PayrollDeductionType[] {
	return input.map((type) => ({
		id: type.id,
		name: type.name.trim(),
		kind: type.kind,
		defaultAmountCents:
			type.kind === 'fixed' ? dollarsToCents(type.defaultAmount, currency) : 0,
		defaultRateBasisPoints:
			type.kind === 'percentage' ? percentToBasisPoints(type.defaultRatePercent) : 0,
		isActive: type.isActive
	}));
}

export function mapDeductionTypesToFormInput(
	types: import('$lib/shared/payroll/deductions').PayrollDeductionType[]
): PayrollDeductionTypesInput['types'] {
	return types.map((type) => ({
		id: type.id,
		name: type.name,
		kind: type.kind,
		defaultAmount: type.defaultAmountCents / 100,
		defaultRatePercent: type.defaultRateBasisPoints / 100,
		isActive: type.isActive
	}));
}

const payrollJobTitleInputSchema = z.object({
	id: z.string().trim().min(1).max(64),
	name: z.string().trim().min(1, 'Name is required.').max(120),
	payType: z.enum(PAYROLL_PAY_TYPES),
	payRate: z.coerce.number().min(0, 'Pay rate must be zero or greater.'),
	isActive: z.coerce.boolean()
});

export const payrollJobTitlesSchema = z.object({
	titles: z.array(payrollJobTitleInputSchema).max(50, 'Too many job titles.')
});

export type PayrollJobTitlesInput = z.infer<typeof payrollJobTitlesSchema>;

export function mapJobTitlesInputToDocument(
	input: PayrollJobTitlesInput['titles'],
	currency: PayrollCurrency = 'PHP'
): import('$lib/shared/payroll/job-titles').PayrollJobTitle[] {
	return input.map((title) => ({
		id: title.id,
		name: title.name.trim(),
		payType: title.payType,
		payRateCents: dollarsToCents(title.payRate, currency),
		isActive: title.isActive
	}));
}

export function mapJobTitlesToFormInput(
	titles: import('$lib/shared/payroll/job-titles').PayrollJobTitle[],
	currency: PayrollCurrency = 'PHP'
): PayrollJobTitlesInput['titles'] {
	return titles.map((title) => ({
		id: title.id,
		name: title.name,
		payType: title.payType,
		payRate: centsToMajorUnits(title.payRateCents, currency),
		isActive: title.isActive
	}));
}
