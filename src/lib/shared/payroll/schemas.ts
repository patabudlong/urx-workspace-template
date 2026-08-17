import { z } from 'zod';

export const PAYROLL_RUN_STATUSES = ['draft', 'processing', 'completed', 'failed'] as const;

export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export const PAYROLL_PAY_TYPES = ['salary', 'hourly'] as const;

export type PayrollPayType = (typeof PAYROLL_PAY_TYPES)[number];

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
	lastName: z.string().trim().min(1, 'Last name is required.').max(80),
	email: z
		.string()
		.trim()
		.email('Enter a valid email address.')
		.optional()
		.or(z.literal('')),
	jobTitle: z.string().trim().max(120).optional().or(z.literal('')),
	payType: z.enum(PAYROLL_PAY_TYPES),
	payRate: z.coerce.number().min(0, 'Pay rate must be zero or greater.')
});

export type CreatePayrollEmployeeInput = z.infer<typeof createPayrollEmployeeSchema>;

export const createPayrollEmployeeDefaults: CreatePayrollEmployeeInput = {
	firstName: '',
	lastName: '',
	email: '',
	jobTitle: '',
	payType: 'salary',
	payRate: 0
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
