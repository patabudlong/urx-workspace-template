import type { DtrHolidayEntry, DtrHolidayCalendarRates } from '$lib/shared/dtr/holidays';
import { resolveDtrHolidayDayCredit } from '$lib/shared/dtr/holidays';
import type { DtrDayDto } from '$lib/shared/models/dtr-day';

export type PayrollHolidayContext = {
	year: number;
	rates: DtrHolidayCalendarRates;
	byDate: Map<string, DtrHolidayEntry>;
};

function listHolidayDatesInPeriod(input: {
	periodStart: string;
	periodEnd: string;
	holidayContexts: Map<number, PayrollHolidayContext | null>;
}): Array<{
	date: string;
	holiday: DtrHolidayEntry;
	rates: DtrHolidayCalendarRates;
}> {
	const holidays: Array<{
		date: string;
		holiday: DtrHolidayEntry;
		rates: DtrHolidayCalendarRates;
	}> = [];

	for (const context of input.holidayContexts.values()) {
		if (!context) {
			continue;
		}

		for (const [date, holiday] of context.byDate) {
			if (date >= input.periodStart && date <= input.periodEnd) {
				holidays.push({ date, holiday, rates: context.rates });
			}
		}
	}

	return holidays.sort((left, right) => left.date.localeCompare(right.date));
}

function createSyntheticUnworkedHolidayDay(input: {
	workspaceId: string;
	employeeId: string;
	date: string;
	credit: ReturnType<typeof resolveDtrHolidayDayCredit>;
}): DtrDayDto {
	return {
		id: `synthetic-holiday:${input.employeeId}:${input.date}`,
		workspaceId: input.workspaceId,
		employeeId: input.employeeId,
		date: input.date,
		status: 'pending',
		timeIn: null,
		timeOut: null,
		morningTimeIn: null,
		morningTimeOut: null,
		afternoonTimeIn: null,
		afternoonTimeOut: null,
		workedMinutes: 0,
		source: 'manual',
		approvalStatus: 'draft',
		notes: null,
		holidayCategory: input.credit.category,
		holidayName: input.credit.name,
		holidayWorked: false,
		holidayPayPercent: input.credit.payPercent,
		lockedByRunId: null,
		createdAt: '',
		updatedAt: ''
	};
}

/**
 * Adds unworked holiday pay credits for configured calendar holidays that have no
 * saved time record in the pay period. Existing records are left unchanged.
 */
export function mergeUnworkedHolidayCreditsForPayroll(input: {
	workspaceId: string;
	employeeId: string;
	periodStart: string;
	periodEnd: string;
	dtrDays: DtrDayDto[];
	holidayContexts: Map<number, PayrollHolidayContext | null>;
}): DtrDayDto[] {
	const recordedDates = new Set(input.dtrDays.map((day) => day.date));
	const syntheticDays: DtrDayDto[] = [];

	for (const { date, holiday, rates } of listHolidayDatesInPeriod({
		periodStart: input.periodStart,
		periodEnd: input.periodEnd,
		holidayContexts: input.holidayContexts
	})) {
		if (recordedDates.has(date)) {
			continue;
		}

		const credit = resolveDtrHolidayDayCredit({
			holiday,
			rates,
			status: 'pending',
			timeIn: null,
			timeOut: null,
			workedMinutes: 0
		});

		if (credit.payPercent <= 0) {
			continue;
		}

		syntheticDays.push(
			createSyntheticUnworkedHolidayDay({
				workspaceId: input.workspaceId,
				employeeId: input.employeeId,
				date,
				credit
			})
		);
	}

	if (syntheticDays.length === 0) {
		return input.dtrDays;
	}

	return [...input.dtrDays, ...syntheticDays].sort((left, right) =>
		left.date.localeCompare(right.date)
	);
}
