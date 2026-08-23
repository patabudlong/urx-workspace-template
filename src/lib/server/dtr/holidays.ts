import { getDtrHolidayCalendarForWorkspace } from '$lib/server/repositories/dtr-holiday-calendars';
import {
	buildHolidayLookup,
	resolveDtrHolidayDayCredit,
	type DtrHolidayCalendarRates,
	type DtrHolidayDayCredit,
	type DtrHolidayEntry
} from '$lib/shared/dtr/holidays';
import type { DtrDayStatus } from '$lib/shared/dtr/status';

export type DtrHolidayContext = {
	year: number;
	rates: DtrHolidayCalendarRates;
	byDate: Map<string, DtrHolidayEntry>;
};

export async function loadDtrHolidayContextForWorkspace(input: {
	workspaceId: string;
	year: number;
}): Promise<DtrHolidayContext | null> {
	const calendar = await getDtrHolidayCalendarForWorkspace({
		workspaceId: input.workspaceId,
		year: input.year
	});

	if (!calendar) {
		return null;
	}

	return {
		year: calendar.year,
		rates: calendar.rates,
		byDate: buildHolidayLookup(calendar.holidays)
	};
}

export function resolveDtrHolidayCreditForDate(input: {
	context: DtrHolidayContext | null;
	date: string;
	status: DtrDayStatus;
	timeIn: string | null;
	timeOut: string | null;
	workedMinutes: number;
}): DtrHolidayDayCredit | null {
	if (!input.context) {
		return null;
	}

	const holiday = input.context.byDate.get(input.date);

	if (!holiday) {
		return null;
	}

	return resolveDtrHolidayDayCredit({
		holiday,
		rates: input.context.rates,
		status: input.status,
		timeIn: input.timeIn,
		timeOut: input.timeOut,
		workedMinutes: input.workedMinutes
	});
}

export function resolveHolidayFieldsForDay(input: {
	context: DtrHolidayContext | null;
	date: string;
	status: DtrDayStatus;
	timeIn: string | null;
	timeOut: string | null;
	workedMinutes: number;
}): {
	holidayCategory: DtrHolidayDayCredit['category'] | null;
	holidayName: string | null;
	holidayWorked: boolean | null;
	holidayPayPercent: number | null;
} {
	const credit = resolveDtrHolidayCreditForDate(input);

	if (!credit) {
		return {
			holidayCategory: null,
			holidayName: null,
			holidayWorked: null,
			holidayPayPercent: null
		};
	}

	return {
		holidayCategory: credit.category,
		holidayName: credit.name,
		holidayWorked: credit.worked,
		holidayPayPercent: credit.payPercent
	};
}
