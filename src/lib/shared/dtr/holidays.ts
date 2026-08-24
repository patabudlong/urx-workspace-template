import type { DtrDayStatus } from '$lib/shared/dtr/status';
import type { DtrDayDto } from '$lib/shared/models/dtr-day';

export const DTR_HOLIDAY_CATEGORIES = [
	'regular',
	'special_non_working',
	'special_working'
] as const;

export type DtrHolidayCategory = (typeof DTR_HOLIDAY_CATEGORIES)[number];

export const DTR_HOLIDAY_CATEGORY_LABELS: Record<DtrHolidayCategory, string> = {
	regular: 'Regular Holidays',
	special_non_working: 'Special Non-Working Days',
	special_working: 'Special Working Days'
};

export type DtrHolidayCategoryRates = {
	workedPercent: number;
	unworkedPercent: number;
};

export type DtrHolidayEntry = {
	date: string;
	name: string;
	category: DtrHolidayCategory;
};

export type DtrHolidayCalendarRates = {
	regularHoliday: DtrHolidayCategoryRates;
	specialNonWorkingDay: DtrHolidayCategoryRates;
	specialWorkingDay: DtrHolidayCategoryRates;
};

export const DTR_HOLIDAY_DEFAULT_RATES: DtrHolidayCalendarRates = {
	regularHoliday: { workedPercent: 200, unworkedPercent: 100 },
	specialNonWorkingDay: { workedPercent: 130, unworkedPercent: 0 },
	specialWorkingDay: { workedPercent: 130, unworkedPercent: 0 }
};

export type DtrHolidayDayCredit = {
	category: DtrHolidayCategory;
	name: string;
	worked: boolean;
	payPercent: number;
};

export function getHolidayRatesForCategory(
	rates: DtrHolidayCalendarRates,
	category: DtrHolidayCategory
): DtrHolidayCategoryRates {
	switch (category) {
		case 'regular':
			return rates.regularHoliday;
		case 'special_non_working':
			return rates.specialNonWorkingDay;
		case 'special_working':
			return rates.specialWorkingDay;
	}
}

export function resolveHolidayPayPercent(
	categoryRates: DtrHolidayCategoryRates,
	worked: boolean
): number {
	return worked ? categoryRates.workedPercent : categoryRates.unworkedPercent;
}

export function isDtrDayWorked(input: {
	status: DtrDayStatus;
	timeIn: string | null;
	timeOut: string | null;
	workedMinutes: number;
}): boolean {
	if (input.workedMinutes > 0) {
		return true;
	}

	if (input.status === 'present') {
		return Boolean(input.timeIn);
	}

	if (input.status === 'partial') {
		return Boolean(input.timeIn);
	}

	return false;
}

export function resolveDtrHolidayDayCredit(input: {
	holiday: DtrHolidayEntry;
	rates: DtrHolidayCalendarRates;
	status: DtrDayStatus;
	timeIn: string | null;
	timeOut: string | null;
	workedMinutes: number;
}): DtrHolidayDayCredit {
	const categoryRates = getHolidayRatesForCategory(input.rates, input.holiday.category);
	const worked = isDtrDayWorked({
		status: input.status,
		timeIn: input.timeIn,
		timeOut: input.timeOut,
		workedMinutes: input.workedMinutes
	});

	return {
		category: input.holiday.category,
		name: input.holiday.name,
		worked,
		payPercent: resolveHolidayPayPercent(categoryRates, worked)
	};
}

export function buildHolidayLookup(entries: DtrHolidayEntry[]): Map<string, DtrHolidayEntry> {
	return new Map(entries.map((entry) => [entry.date, entry]));
}

export function defaultHolidayCalendarTitle(year: number): string {
	return `${year} Holiday Calendar`;
}

export function sanitizeHolidayCalendarInput(
	input: {
		year: number;
		title: string;
		regularHoliday: DtrHolidayCategoryRates;
		specialNonWorkingDay: DtrHolidayCategoryRates;
		specialWorkingDay: DtrHolidayCategoryRates;
		holidays: DtrHolidayEntry[];
	}
): typeof input {
	return {
		...input,
		title: input.title.trim(),
		holidays: input.holidays
			.filter((holiday) => holiday.date.trim().length > 0 && holiday.name.trim().length > 0)
			.map((holiday) => ({
				date: holiday.date.trim(),
				name: holiday.name.trim(),
				category: holiday.category
			}))
	};
}

export function formatHolidayPayPercent(percent: number): string {
	return `${percent}%`;
}

export function enrichDtrDayWithHolidayCredit(
	day: DtrDayDto,
	holiday: DtrHolidayEntry | null,
	rates: DtrHolidayCalendarRates | null
): DtrDayDto {
	if (!holiday || !rates) {
		return {
			...day,
			holidayCategory: null,
			holidayName: null,
			holidayWorked: null,
			holidayPayPercent: null
		};
	}

	const credit = resolveDtrHolidayDayCredit({
		holiday,
		rates,
		status: day.status,
		timeIn: day.timeIn,
		timeOut: day.timeOut,
		workedMinutes: day.workedMinutes
	});

	return {
		...day,
		holidayCategory: credit.category,
		holidayName: credit.name,
		holidayWorked: credit.worked,
		holidayPayPercent: credit.payPercent
	};
}
