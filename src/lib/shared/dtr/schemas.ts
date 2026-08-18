import { z } from 'zod';
import { DTR_DAY_SOURCES, DTR_DAY_STATUSES } from '$lib/shared/dtr/status';
import { DTR_WEEK_DAYS } from '$lib/shared/dtr/weekdays';

const timeInputSchema = z
	.string()
	.trim()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time (HH:MM).');

const dtrDateSchema = z
	.string()
	.trim()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');

export const dtrSettingsSchema = z.object({
	restDays: z
		.array(z.enum(DTR_WEEK_DAYS))
		.min(1, 'Select at least one rest day.')
		.max(6, 'At least one work day is required.'),
	standardWorkMinutes: z.coerce
		.number()
		.int()
		.min(60, 'Standard work time must be at least 60 minutes.')
		.max(720, 'Standard work time cannot exceed 12 hours.')
});

export type DtrSettingsInput = z.infer<typeof dtrSettingsSchema>;

export const dtrSettingsDefaults: DtrSettingsInput = {
	restDays: ['sunday'],
	standardWorkMinutes: 480
};

export const dtrDaysQuerySchema = z.object({
	month: z
		.string()
		.trim()
		.regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM.'),
	employeeId: z.string().trim().optional()
});

export type DtrDaysQuery = z.infer<typeof dtrDaysQuerySchema>;

export const upsertDtrDaySchema = z
	.object({
		employeeId: z.string().trim().min(1, 'Employee is required.'),
		date: dtrDateSchema,
		status: z.enum(DTR_DAY_STATUSES),
		timeIn: timeInputSchema.optional().or(z.literal('')),
		timeOut: timeInputSchema.optional().or(z.literal('')),
		source: z.enum(DTR_DAY_SOURCES).default('manual'),
		notes: z.string().trim().max(500).optional().or(z.literal(''))
	})
	.superRefine((data, ctx) => {
		if (data.status === 'present' || data.status === 'partial') {
			if (!data.timeIn) {
				ctx.addIssue({
					code: 'custom',
					message: 'Time in is required for present or partial days.',
					path: ['timeIn']
				});
			}
		}
	});

export type UpsertDtrDayInput = z.infer<typeof upsertDtrDaySchema>;
