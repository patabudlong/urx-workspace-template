export function formatPeriodLabel(year: number, month: number): string {
	const date = new Date(Date.UTC(year, month - 1, 1));
	return new Intl.DateTimeFormat('en-PH', { month: 'short', year: 'numeric' }).format(date);
}

export function getCalendarMonthBounds(year: number, month: number): {
	startDate: string;
	endDate: string;
} {
	const start = new Date(Date.UTC(year, month - 1, 1));
	const end = new Date(Date.UTC(year, month, 0));
	const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

	return {
		startDate: toIsoDate(start),
		endDate: toIsoDate(end)
	};
}

export function buildFiscalYearPeriods(input: {
	year: number;
	fiscalYearStartMonth: number;
}): Array<{ year: number; month: number; label: string; startDate: string; endDate: string }> {
	const periods = [];

	for (let offset = 0; offset < 12; offset += 1) {
		const absoluteMonth = input.fiscalYearStartMonth + offset;
		const month = ((absoluteMonth - 1) % 12) + 1;
		const year = input.year + Math.floor((absoluteMonth - 1) / 12);
		const bounds = getCalendarMonthBounds(year, month);

		periods.push({
			year,
			month,
			label: formatPeriodLabel(year, month),
			startDate: bounds.startDate,
			endDate: bounds.endDate
		});
	}

	return periods;
}

export function isDateWithinPeriod(entryDate: string, period: { startDate: string; endDate: string }) {
	return entryDate >= period.startDate && entryDate <= period.endDate;
}
