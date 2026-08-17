import type { PayFrequency } from '$lib/shared/payroll/frequency';
import { requiresPeriodAnchor } from '$lib/shared/payroll/frequency';
import { resolvePayrollTimezone } from '$lib/shared/payroll/timezone';

export type PayrollScheduleInput = {
	payFrequency: PayFrequency;
	timezone: string;
	weekStartDay: string | null;
	periodAnchorDate: string | null;
};

export type PayPeriodRange = {
	periodStart: string;
	periodEnd: string;
};

const MS_PER_DAY = 86_400_000;

function parseDateInput(value: string): { year: number; month: number; day: number } {
	const [year, month, day] = value.split('-').map(Number);
	return { year, month, day };
}

function formatDateInput(year: number, month: number, day: number): string {
	return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function utcMsFromDateInput(value: string): number {
	const { year, month, day } = parseDateInput(value);
	return Date.UTC(year, month - 1, day);
}

function dateInputFromUtcMs(ms: number): string {
	const date = new Date(ms);
	return formatDateInput(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function addDays(value: string, days: number): string {
	return dateInputFromUtcMs(utcMsFromDateInput(value) + days * MS_PER_DAY);
}

function daysInMonth(year: number, month: number): number {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function formatTodayInTimezone(timezone: string): string {
	const resolvedTimezone = resolvePayrollTimezone(timezone);

	return new Intl.DateTimeFormat('en-CA', {
		timeZone: resolvedTimezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

function getSemiMonthlyPeriod(date: string): PayPeriodRange {
	const { year, month, day } = parseDateInput(date);

	if (day <= 15) {
		return {
			periodStart: formatDateInput(year, month, 1),
			periodEnd: formatDateInput(year, month, 15)
		};
	}

	return {
		periodStart: formatDateInput(year, month, 16),
		periodEnd: formatDateInput(year, month, daysInMonth(year, month))
	};
}

function getNextSemiMonthlyPeriod(periodEnd: string): PayPeriodRange {
	const nextDay = addDays(periodEnd, 1);
	return getSemiMonthlyPeriod(nextDay);
}

function getMonthlyPeriod(date: string): PayPeriodRange {
	const { year, month } = parseDateInput(date);
	return {
		periodStart: formatDateInput(year, month, 1),
		periodEnd: formatDateInput(year, month, daysInMonth(year, month))
	};
}

function getNextMonthlyPeriod(periodEnd: string): PayPeriodRange {
	const nextDay = addDays(periodEnd, 1);
	return getMonthlyPeriod(nextDay);
}

function getFixedLengthPeriod(anchorDate: string, lengthDays: number, date: string): PayPeriodRange {
	const anchorMs = utcMsFromDateInput(anchorDate);
	const dateMs = utcMsFromDateInput(date);
	const diffDays = Math.floor((dateMs - anchorMs) / MS_PER_DAY);
	const periodIndex = Math.floor(diffDays / lengthDays);
	const startMs = anchorMs + periodIndex * lengthDays * MS_PER_DAY;
	const endMs = startMs + (lengthDays - 1) * MS_PER_DAY;

	return {
		periodStart: dateInputFromUtcMs(startMs),
		periodEnd: dateInputFromUtcMs(endMs)
	};
}

function getNextFixedLengthPeriod(
	anchorDate: string,
	lengthDays: number,
	periodEnd: string
): PayPeriodRange {
	return getFixedLengthPeriod(anchorDate, lengthDays, addDays(periodEnd, 1));
}

export function getPayPeriodForDate(
	settings: PayrollScheduleInput,
	date: string
): PayPeriodRange | null {
	if (requiresPeriodAnchor(settings.payFrequency)) {
		if (!settings.periodAnchorDate) {
			return null;
		}

		const lengthDays = settings.payFrequency === 'weekly' ? 7 : 14;
		return getFixedLengthPeriod(settings.periodAnchorDate, lengthDays, date);
	}

	if (settings.payFrequency === 'semi-monthly') {
		return getSemiMonthlyPeriod(date);
	}

	return getMonthlyPeriod(date);
}

export function getNextPayPeriod(
	settings: PayrollScheduleInput,
	afterPeriodEnd: string
): PayPeriodRange | null {
	if (requiresPeriodAnchor(settings.payFrequency)) {
		if (!settings.periodAnchorDate) {
			return null;
		}

		const lengthDays = settings.payFrequency === 'weekly' ? 7 : 14;
		return getNextFixedLengthPeriod(settings.periodAnchorDate, lengthDays, afterPeriodEnd);
	}

	if (settings.payFrequency === 'semi-monthly') {
		return getNextSemiMonthlyPeriod(afterPeriodEnd);
	}

	return getNextMonthlyPeriod(afterPeriodEnd);
}

export function formatPayRunTitle(periodStart: string, periodEnd: string, frequency: PayFrequency): string {
	const start = parseDateInput(periodStart);
	const end = parseDateInput(periodEnd);
	const startLabel = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	}).format(new Date(Date.UTC(start.year, start.month - 1, start.day)));

	if (frequency === 'monthly' && start.day === 1 && end.day === daysInMonth(end.year, end.month)) {
		return `${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
			new Date(Date.UTC(start.year, start.month - 1, start.day))
		)} Payroll`;
	}

	const endLabel = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: start.year === end.year ? undefined : 'numeric',
		timeZone: 'UTC'
	}).format(new Date(Date.UTC(end.year, end.month - 1, end.day)));

	return `${startLabel}–${endLabel} Payroll`;
}

export function suggestNextPayRunPeriod(
	settings: PayrollScheduleInput,
	input?: { lastPeriodEnd?: string | null; today?: string }
): ({ title: string } & PayPeriodRange) | null {
	const today = input?.today ?? formatTodayInTimezone(settings.timezone);
	const period = input?.lastPeriodEnd
		? getNextPayPeriod(settings, input.lastPeriodEnd)
		: getPayPeriodForDate(settings, today);

	if (!period) {
		return null;
	}

	return {
		...period,
		title: formatPayRunTitle(period.periodStart, period.periodEnd, settings.payFrequency)
	};
}
