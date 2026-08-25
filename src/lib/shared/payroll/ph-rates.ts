import type { PayFrequency } from '$lib/shared/payroll/frequency';
import type { PayrollPayType } from '$lib/shared/payroll/pay-rate';

/** DOLE-style factor: monthly minimum wage ÷ 26 working days. */
export const PH_MONTHLY_WORKING_DAYS = 26;

/** Reference daily minimum wage (PHP) — update when wage orders change. */
export const PH_REFERENCE_DAILY_MINIMUM_WAGE = 525;

/** Reference monthly minimum wage (PHP) aligned with daily × 26 + adjustment. */
export const PH_REFERENCE_MONTHLY_MINIMUM_WAGE = 13693.75;

export const PH_PAY_RATE_PRESET_CUSTOM = 'custom' as const;
export const PH_PAY_RATE_PRESET_MINIMUM_DAILY = 'minimum-daily' as const;

export const PH_PAY_RATE_PRESET_IDS = [
	PH_PAY_RATE_PRESET_CUSTOM,
	PH_PAY_RATE_PRESET_MINIMUM_DAILY
] as const;

export type PhPayRatePresetId = (typeof PH_PAY_RATE_PRESET_IDS)[number];

export function formatPhMinimumDailyWageLabel(): string {
	return `Minimum wage (₱${PH_REFERENCE_DAILY_MINIMUM_WAGE.toLocaleString()}/day)`;
}

export const PH_PAY_RATE_PRESET_LABELS: Record<PhPayRatePresetId, string> = {
	custom: 'Custom amount',
	'minimum-daily': formatPhMinimumDailyWageLabel()
};

export function resolvePhPayRatePreset(
	payType: PayrollPayType,
	payRate: number
): PhPayRatePresetId {
	if (payType === 'daily' && payRate === PH_REFERENCE_DAILY_MINIMUM_WAGE) {
		return PH_PAY_RATE_PRESET_MINIMUM_DAILY;
	}

	return PH_PAY_RATE_PRESET_CUSTOM;
}

export function applyPhPayRatePreset(presetId: PhPayRatePresetId): {
	payType: PayrollPayType;
	payRate: number;
} | null {
	if (presetId === PH_PAY_RATE_PRESET_MINIMUM_DAILY) {
		return {
			payType: 'daily',
			payRate: PH_REFERENCE_DAILY_MINIMUM_WAGE
		};
	}

	return null;
}

export type PayrollPayRateDerivation = {
	dailyRate: number;
	semiMonthlyRate: number;
	workingDaysPerMonth: number;
};

export function deriveMonthlyPayRates(
	monthlyRate: number,
	workingDaysPerMonth = PH_MONTHLY_WORKING_DAYS
): PayrollPayRateDerivation {
	const safeMonthly = Math.max(0, monthlyRate);
	const dailyRate = workingDaysPerMonth > 0 ? safeMonthly / workingDaysPerMonth : 0;

	return {
		dailyRate,
		semiMonthlyRate: safeMonthly / 2,
		workingDaysPerMonth
	};
}

export function deriveRatesFromDailyPay(
	dailyRate: number,
	workingDaysPerMonth = PH_MONTHLY_WORKING_DAYS
): PayrollPayRateDerivation {
	const safeDaily = Math.max(0, dailyRate);
	const monthlyRate = safeDaily * workingDaysPerMonth;

	return {
		dailyRate: safeDaily,
		semiMonthlyRate: monthlyRate / 2,
		workingDaysPerMonth
	};
}

function parsePeriodDate(value: string): { year: number; month: number; day: number } {
	const [year, month, day] = value.split('-').map(Number);
	return { year, month, day };
}

function daysInCalendarMonth(year: number, month: number): number {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isStandardSemiMonthlyFirstHalf(periodStart: string, periodEnd: string): boolean {
	const start = parsePeriodDate(periodStart);
	const end = parsePeriodDate(periodEnd);
	return start.day === 1 && end.day === 15 && start.month === end.month && start.year === end.year;
}

export function isStandardSemiMonthlySecondHalf(periodStart: string, periodEnd: string): boolean {
	const start = parsePeriodDate(periodStart);
	const end = parsePeriodDate(periodEnd);
	const monthDays = daysInCalendarMonth(end.year, end.month);

	return (
		start.day === 16 &&
		end.day === monthDays &&
		start.month === end.month &&
		start.year === end.year
	);
}

export function isStandardSemiMonthlyPeriod(periodStart: string, periodEnd: string): boolean {
	return (
		isStandardSemiMonthlyFirstHalf(periodStart, periodEnd) ||
		isStandardSemiMonthlySecondHalf(periodStart, periodEnd)
	);
}

export function computeSalariedBasePayCents(input: {
	payRateCents: number;
	periodStart: string;
	periodEnd: string;
	payFrequency: PayFrequency;
}): number {
	const { payRateCents, periodStart, periodEnd, payFrequency } = input;

	if (payFrequency === 'semi-monthly' && isStandardSemiMonthlyPeriod(periodStart, periodEnd)) {
		return Math.round(payRateCents / 2);
	}

	if (payFrequency === 'monthly') {
		const start = parsePeriodDate(periodStart);
		const end = parsePeriodDate(periodEnd);
		const monthDays = daysInCalendarMonth(end.year, end.month);

		if (start.day === 1 && end.day === monthDays) {
			return payRateCents;
		}
	}

	const periodDays = Math.max(
		0,
		Math.round(
			(Date.parse(`${periodEnd}T00:00:00Z`) - Date.parse(`${periodStart}T00:00:00Z`)) /
				86_400_000
		) + 1
	);
	const monthDays = daysInCalendarMonth(parsePeriodDate(periodEnd).year, parsePeriodDate(periodEnd).month);

	return Math.round((payRateCents * periodDays) / monthDays);
}

/** Split a monthly amount across pay periods (e.g. semi-monthly fixed deductions). */
export function computeMonthlyAmountForPayPeriod(input: {
	monthlyAmountCents: number;
	periodStart: string;
	periodEnd: string;
	payFrequency: PayFrequency;
}): number {
	return computeSalariedBasePayCents({
		payRateCents: input.monthlyAmountCents,
		periodStart: input.periodStart,
		periodEnd: input.periodEnd,
		payFrequency: input.payFrequency
	});
}
