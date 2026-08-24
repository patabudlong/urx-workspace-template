import { isRestDay, type DtrWeekDay } from '$lib/shared/dtr/weekdays';
import { isWorkScheduleRestDay } from '$lib/shared/dtr/work-schedule';
import type { DtrDayStatus } from '$lib/shared/dtr/status';
import type { DtrDayDto } from '$lib/shared/models/dtr-day';
import type { DtrHolidayEntry, DtrHolidayCalendarRates } from '$lib/shared/dtr/holidays';
import { getHolidayRatesForCategory } from '$lib/shared/dtr/holidays';
import type { DtrWorkScheduleDto } from '$lib/shared/models/dtr-work-schedule';
import {
	computeUndertimeMinutes,
	resolveExpectedWorkMinutesForDate
} from '$lib/shared/dtr/undertime';

export type DtrCalendarCell = {
	date: string;
	dayOfMonth: number;
	isCurrentMonth: boolean;
	isRestDay: boolean;
	status: DtrDayStatus;
	recordId: string | null;
	holidayName: string | null;
	holidayPayPercent: number | null;
	isLocked: boolean;
	workedMinutes: number;
	expectedWorkMinutes: number;
	undertimeMinutes: number;
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
	standardWorkMinutes: number;
	records: DtrDayDto[];
	holidays?: DtrHolidayEntry[];
	holidayRates?: DtrHolidayCalendarRates | null;
	lockedDates?: Set<string>;
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

		const workedMinutes = record?.workedMinutes ?? 0;
		const expectedWorkMinutes = resolveExpectedWorkMinutesForDate({
			date,
			restDays: input.restDays,
			workSchedule: input.workSchedule,
			standardWorkMinutes: input.standardWorkMinutes
		});
		const undertimeMinutes = computeUndertimeMinutes({
			workedMinutes,
			expectedWorkMinutes,
			status
		});

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
			holidayPayPercent,
			isLocked: Boolean(record?.lockedByRunId) || Boolean(input.lockedDates?.has(date)),
			workedMinutes,
			expectedWorkMinutes,
			undertimeMinutes
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

export type DtrDayTimePunchesInput = {
	timeIn?: string | null;
	timeOut?: string | null;
	morningTimeIn?: string | null;
	morningTimeOut?: string | null;
	afternoonTimeIn?: string | null;
	afternoonTimeOut?: string | null;
};

export function hasSplitDtrTimePunches(input: DtrDayTimePunchesInput): boolean {
	return Boolean(
		input.morningTimeIn ||
			input.morningTimeOut ||
			input.afternoonTimeIn ||
			input.afternoonTimeOut
	);
}

export function collapseDtrTimePunches(input: DtrDayTimePunchesInput): {
	timeIn: string | null;
	timeOut: string | null;
} {
	if (!hasSplitDtrTimePunches(input)) {
		return {
			timeIn: input.timeIn ?? null,
			timeOut: input.timeOut ?? null
		};
	}

	let earliestIn: string | null = null;
	let earliestInMinutes = Number.POSITIVE_INFINITY;
	let latestOut: string | null = null;
	let latestOutMinutes = Number.NEGATIVE_INFINITY;

	const segments = [
		{ timeIn: input.morningTimeIn, timeOut: input.morningTimeOut },
		{ timeIn: input.afternoonTimeIn, timeOut: input.afternoonTimeOut }
	];

	for (const segment of segments) {
		if (segment.timeIn) {
			const minutes = parseTimeToMinutes(segment.timeIn);

			if (minutes < earliestInMinutes) {
				earliestInMinutes = minutes;
				earliestIn = segment.timeIn;
			}
		}

		if (segment.timeOut) {
			const minutes = parseTimeToMinutes(segment.timeOut);

			if (minutes > latestOutMinutes) {
				latestOutMinutes = minutes;
				latestOut = segment.timeOut;
			}
		}
	}

	return { timeIn: earliestIn, timeOut: latestOut };
}

export function computeDtrDayWorkedMinutes(
	input: DtrDayTimePunchesInput,
	lunchBreak?: DtrLunchBreakWindow | null
): number {
	if (hasSplitDtrTimePunches(input)) {
		let total = 0;

		if (input.morningTimeIn && input.morningTimeOut) {
			total += computeWorkedMinutes(input.morningTimeIn, input.morningTimeOut);
		}

		if (input.afternoonTimeIn && input.afternoonTimeOut) {
			total += computeWorkedMinutes(input.afternoonTimeIn, input.afternoonTimeOut);
		}

		return total;
	}

	return computeWorkedMinutes(input.timeIn ?? null, input.timeOut ?? null, lunchBreak);
}
