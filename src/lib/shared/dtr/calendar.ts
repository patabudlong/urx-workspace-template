import { isRestDay, type DtrWeekDay } from '$lib/shared/dtr/weekdays';
import { isWorkScheduleRestDay } from '$lib/shared/dtr/work-schedule';
import type { DtrDayStatus } from '$lib/shared/dtr/status';
import type { DtrDayDto } from '$lib/shared/models/dtr-day';
import type { DtrHolidayEntry, DtrHolidayCalendarRates } from '$lib/shared/dtr/holidays';
import { getHolidayRatesForCategory } from '$lib/shared/dtr/holidays';
import type { DtrWorkScheduleDto } from '$lib/shared/models/dtr-work-schedule';

export type DtrCalendarCell = {
	date: string;
	dayOfMonth: number;
	isCurrentMonth: boolean;
	isRestDay: boolean;
	status: DtrDayStatus;
	recordId: string | null;
	holidayName: string | null;
	holidayPayPercent: number | null;
};

export function getMonthDateRange(month: string): { start: string; end: string; days: string[] } {
	const [yearText, monthText] = month.split('-');
	const year = Number(yearText);
	const monthIndex = Number(monthText) - 1;
	const start = new Date(year, monthIndex, 1);
	const end = new Date(year, monthIndex + 1, 0);
	const days: string[] = [];

	for (let day = 1; day <= end.getDate(); day += 1) {
		days.push(`${yearText}-${monthText.padStart(2, '0')}-${String(day).padStart(2, '0')}`);
	}

	return {
		start: days[0] ?? `${month}-01`,
		end: days.at(-1) ?? `${month}-01`,
		days
	};
}

export function resolveDtrDayStatus(input: {
	date: string;
	restDays: DtrWeekDay[];
	workSchedule?: DtrWorkScheduleDto | null;
	record: DtrDayDto | null;
}): DtrDayStatus {
	if (input.record) {
		return input.record.status;
	}

	if (input.workSchedule) {
		if (isWorkScheduleRestDay(input.workSchedule, input.date)) {
			return 'rest';
		}

		return 'pending';
	}

	if (isRestDay(input.date, input.restDays)) {
		return 'rest';
	}

	return 'pending';
}

function isCalendarRestDay(input: {
	date: string;
	restDays: DtrWeekDay[];
	workSchedule?: DtrWorkScheduleDto | null;
}): boolean {
	if (input.workSchedule) {
		return isWorkScheduleRestDay(input.workSchedule, input.date);
	}

	return isRestDay(input.date, input.restDays);
}

export function buildEmployeeMonthCalendar(input: {
	month: string;
	restDays: DtrWeekDay[];
	workSchedule?: DtrWorkScheduleDto | null;
	records: DtrDayDto[];
	holidays?: DtrHolidayEntry[];
	holidayRates?: DtrHolidayCalendarRates | null;
}): DtrCalendarCell[] {
	const { days } = getMonthDateRange(input.month);
	const recordByDate = new Map(input.records.map((record) => [record.date, record]));
	const holidayByDate = new Map((input.holidays ?? []).map((holiday) => [holiday.date, holiday]));

	return days.map((date) => {
		const record = recordByDate.get(date) ?? null;
		const holiday = holidayByDate.get(date) ?? null;
		const status = resolveDtrDayStatus({
			date,
			restDays: input.restDays,
			workSchedule: input.workSchedule,
			record
		});
		let holidayPayPercent = record?.holidayPayPercent ?? null;

		if (holidayPayPercent === null && holiday && input.holidayRates) {
			const categoryRates = getHolidayRatesForCategory(input.holidayRates, holiday.category);
			holidayPayPercent = categoryRates.unworkedPercent;
		}

		return {
			date,
			dayOfMonth: Number(date.slice(8, 10)),
			isCurrentMonth: true,
			isRestDay: isCalendarRestDay({
				date,
				restDays: input.restDays,
				workSchedule: input.workSchedule
			}),
			status,
			recordId: record?.id ?? null,
			holidayName: record?.holidayName ?? holiday?.name ?? null,
			holidayPayPercent
		};
	});
}

export type DtrLunchBreakWindow = {
	startTime: string;
	endTime: string;
};

export function parseTimeToMinutes(time: string): number {
	const [hour, minute] = time.split(':').map(Number);
	return hour * 60 + minute;
}

export function computeOverlapMinutes(
	windowStart: string,
	windowEnd: string,
	overlapStart: string,
	overlapEnd: string
): number {
	const start = parseTimeToMinutes(windowStart);
	const end = parseTimeToMinutes(windowEnd);
	const breakStart = parseTimeToMinutes(overlapStart);
	const breakEnd = parseTimeToMinutes(overlapEnd);

	if (end <= start || breakEnd <= breakStart) {
		return 0;
	}

	const overlap = Math.min(end, breakEnd) - Math.max(start, breakStart);
	return Math.max(0, overlap);
}

export function computeWorkedMinutes(
	timeIn: string | null,
	timeOut: string | null,
	lunchBreak?: DtrLunchBreakWindow | null
): number {
	if (!timeIn || !timeOut) {
		return 0;
	}

	const start = parseTimeToMinutes(timeIn);
	const end = parseTimeToMinutes(timeOut);

	if (end <= start) {
		return 0;
	}

	const grossMinutes = end - start;

	if (!lunchBreak?.startTime || !lunchBreak.endTime) {
		return grossMinutes;
	}

	const breakMinutes = computeOverlapMinutes(
		timeIn,
		timeOut,
		lunchBreak.startTime,
		lunchBreak.endTime
	);

	return Math.max(0, grossMinutes - breakMinutes);
}
