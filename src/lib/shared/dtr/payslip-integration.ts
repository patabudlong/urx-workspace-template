/**
 * Maps DTR time records to payroll payslip earnings.
 *
 * DTR day fields consumed during pay run processing:
 * - `workedMinutes` → basic pay (hourly/daily) and days-or-hours-paid summary
 * - `overtimeMinutes` → overtime pay (hourly rate × 1.25 default multiplier)
 * - `nightShiftMinutes` → night-shift differential (hourly rate × 0.10 default multiplier)
 * - `holidayPayPercent` / rest-day work → holiday or rest-day pay
 *
 * Configure rest days and standard work minutes in DTR settings; holiday rates in DTR
 * holiday calendars. Payroll uses these records when processing a pay run.
 */

export const DTR_PAYSLIP_EARNINGS = {
	workedMinutes: 'Days or hours paid and basic pay (hourly/daily)',
	overtimeMinutes: 'Overtime',
	nightShiftMinutes: 'Night-shift differential',
	holidayPayPercent: 'Holiday or rest-day pay'
} as const;

/** Default overtime multiplier when no workspace override is configured. */
export const DTR_DEFAULT_OVERTIME_RATE_MULTIPLIER = 1.25;

/** Default night-shift differential as a fraction of the hourly rate. */
export const DTR_DEFAULT_NIGHT_SHIFT_RATE_MULTIPLIER = 0.1;
