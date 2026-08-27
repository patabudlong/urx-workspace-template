export function getFiscalYearEndMonth(fiscalYearStartMonth: number): number {
	return ((fiscalYearStartMonth + 10) % 12) + 1;
}

export function getFiscalYearAnchorYear(
	periodYear: number,
	periodMonth: number,
	fiscalYearStartMonth: number
): number {
	return periodMonth >= fiscalYearStartMonth ? periodYear : periodYear - 1;
}

export function isFiscalYearEndPeriod(periodMonth: number, fiscalYearStartMonth: number): boolean {
	return periodMonth === getFiscalYearEndMonth(fiscalYearStartMonth);
}
