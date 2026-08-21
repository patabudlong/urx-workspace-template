import {
	WEEK_START_DAYS,
	WEEK_START_DAY_LABELS,
	type WeekStartDay
} from '$lib/shared/payroll/frequency';

export const DTR_WEEK_DAYS = WEEK_START_DAYS;
export type DtrWeekDay = WeekStartDay;
export const DTR_WEEK_DAY_LABELS = WEEK_START_DAY_LABELS;

const WEEKDAY_INDEX: Record<DtrWeekDay, number> = {
	sunday: 0,
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6
};

export function getWeekDayFromDate(date: string): DtrWeekDay {
	const dayIndex = new Date(`${date}T12:00:00`).getDay();
	return DTR_WEEK_DAYS[dayIndex] ?? 'monday';
}

export function isRestDay(date: string, restDays: DtrWeekDay[]): boolean {
	return restDays.includes(getWeekDayFromDate(date));
}

export function sortWeekDays(days: DtrWeekDay[]): DtrWeekDay[] {
	return [...days].sort((a, b) => WEEKDAY_INDEX[a] - WEEKDAY_INDEX[b]);
}
