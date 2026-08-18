import { isRestDay, type DtrWeekDay } from '$lib/shared/dtr/weekdays';
import type { DtrDayStatus } from '$lib/shared/dtr/status';
import type { DtrDayDto } from '$lib/shared/models/dtr-day';

export type DtrCalendarCell = {
	date: string;
	dayOfMonth: number;
	isCurrentMonth: boolean;
	isRestDay: boolean;
	status: DtrDayStatus;
	recordId: string | null;
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
	record: DtrDayDto | null;
}): DtrDayStatus {
	if (input.record) {
		return input.record.status;
	}

	if (isRestDay(input.date, input.restDays)) {
		return 'rest';
	}

	return 'pending';
}

export function buildEmployeeMonthCalendar(input: {
	month: string;
	restDays: DtrWeekDay[];
	records: DtrDayDto[];
}): DtrCalendarCell[] {
	const { days } = getMonthDateRange(input.month);
	const recordByDate = new Map(input.records.map((record) => [record.date, record]));

	return days.map((date) => {
		const record = recordByDate.get(date) ?? null;
		const status = resolveDtrDayStatus({ date, restDays: input.restDays, record });

		return {
			date,
			dayOfMonth: Number(date.slice(8, 10)),
			isCurrentMonth: true,
			isRestDay: isRestDay(date, input.restDays),
			status,
			recordId: record?.id ?? null
		};
	});
}

export function computeWorkedMinutes(timeIn: string | null, timeOut: string | null): number {
	if (!timeIn || !timeOut) {
		return 0;
	}

	const [inHour, inMinute] = timeIn.split(':').map(Number);
	const [outHour, outMinute] = timeOut.split(':').map(Number);
	const start = inHour * 60 + inMinute;
	const end = outHour * 60 + outMinute;

	if (end <= start) {
		return 0;
	}

	return end - start;
}
