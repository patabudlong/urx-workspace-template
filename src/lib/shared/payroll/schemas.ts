import { z } from 'zod';

export const PAYROLL_RUN_STATUSES = ['draft', 'processing', 'completed', 'failed'] as const;

export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export const payrollRunsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type PayrollRunsQuery = z.infer<typeof payrollRunsQuerySchema>;
