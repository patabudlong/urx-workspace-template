import type { DtrDayStatus } from '$lib/shared/dtr/status';
import { parseTimeToMinutes } from '$lib/shared/dtr/calendar';

export type NgTimecardPunch = {
	timeIn: string | null;
	timeOut: string | null;
};

export type NgTimecardDay = {
	date: string;
	punches: NgTimecardPunch[];
	dailyTotal: string | null;
	note: string | null;
};

export type NgTimecardEmployee = {
	displayName: string;
	employeeCode: string;
	payPeriodStart: string;
	payPeriodEnd: string;
	days: NgTimecardDay[];
	totalHours: string | null;
};

export type NgTimecardReport = {
	employees: NgTimecardEmployee[];
};

export type NgTimecardImportRow = {
	employeeCode: string;
	date: string;
	status: DtrDayStatus;
	timeIn: string | null;
	timeOut: string | null;
	notes: string | null;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PAY_PERIOD_PATTERN = /^(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$/;
const AM_PM_TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

function cellToString(value: unknown): string {
	if (value == null) {
		return '';
	}

	if (value instanceof Date) {
		const year = value.getFullYear();
		const month = String(value.getMonth() + 1).padStart(2, '0');
		const day = String(value.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	return String(value).trim();
}

export function parseNgAmPmTimeTo24h(time: string): string | null {
	const trimmed = time.trim();

	if (!trimmed) {
		return null;
	}

	const match = trimmed.match(AM_PM_TIME_PATTERN);

	if (!match) {
		return null;
	}

	let hour = Number(match[1]);
	const minute = match[2];
	const meridiem = match[3].toUpperCase();

	if (meridiem === 'AM') {
		if (hour === 12) {
			hour = 0;
		}
	} else if (hour !== 12) {
		hour += 12;
	}

	return `${String(hour).padStart(2, '0')}:${minute}`;
}

export function parseNgEmployeeCell(cell: string): { displayName: string; employeeCode: string } | null {
	const trimmed = cell.trim();

	if (!trimmed) {
		return null;
	}

	const codeMatch = trimmed.match(/\(([^)]+)\)\s*$/);

	if (!codeMatch) {
		return null;
	}

	const employeeCode = codeMatch[1].trim();
	const displayName = trimmed.replace(/\s*\([^)]+\)\s*$/, '').trim();

	if (!employeeCode) {
		return null;
	}

	return { displayName, employeeCode };
}

export function parseNgPayPeriod(cell: string): { start: string; end: string } | null {
	const match = cell.trim().match(PAY_PERIOD_PATTERN);

	if (!match) {
		return null;
	}

	return { start: match[1], end: match[2] };
}

export function collapseNgPunchesToWindow(punches: NgTimecardPunch[]): {
	timeIn: string | null;
	timeOut: string | null;
} {
	let earliestIn: string | null = null;
	let earliestInMinutes = Number.POSITIVE_INFINITY;
	let latestOut: string | null = null;
	let latestOutMinutes = Number.NEGATIVE_INFINITY;

	for (const punch of punches) {
		if (punch.timeIn) {
			const minutes = parseTimeToMinutes(punch.timeIn);

			if (minutes < earliestInMinutes) {
				earliestInMinutes = minutes;
				earliestIn = punch.timeIn;
			}
		}

		if (punch.timeOut) {
			const minutes = parseTimeToMinutes(punch.timeOut);

			if (minutes > latestOutMinutes) {
				latestOutMinutes = minutes;
				latestOut = punch.timeOut;
			}
		}
	}

	return { timeIn: earliestIn, timeOut: latestOut };
}

export function resolveNgDayStatus(input: {
	timeIn: string | null;
	timeOut: string | null;
	note: string | null;
}): DtrDayStatus | null {
	const { timeIn, timeOut, note } = input;

	if (!timeIn && !timeOut) {
		return null;
	}

	if (timeIn && !timeOut) {
		return 'partial';
	}

	if (!timeIn && timeOut) {
		return 'partial';
	}

	const normalizedNote = note?.trim().toLowerCase() ?? '';

	if (normalizedNote.includes('missing out') || normalizedNote.includes('missing in')) {
		return 'partial';
	}

	return 'present';
}

export function buildNgTimecardImportRow(
	employeeCode: string,
	day: NgTimecardDay,
	options: {
		isRestDay: boolean;
		markAbsentOnEmpty: boolean;
	}
): NgTimecardImportRow | null {
	const { timeIn, timeOut } = collapseNgPunchesToWindow(day.punches);
	const statusFromPunches = resolveNgDayStatus({
		timeIn,
		timeOut,
		note: day.note
	});

	if (!statusFromPunches) {
		if (options.isRestDay) {
			return null;
		}

		if (options.markAbsentOnEmpty) {
			return {
				employeeCode,
				date: day.date,
				status: 'absent',
				timeIn: null,
				timeOut: null,
				notes: day.note
			};
		}

		return null;
	}

	return {
		employeeCode,
		date: day.date,
		status: statusFromPunches,
		timeIn,
		timeOut,
		notes: day.note
	};
}

export function parseNgTimecardRows(rows: unknown[][]): NgTimecardReport {
	const employees: NgTimecardEmployee[] = [];
	let payPeriod: { start: string; end: string } | null = null;
	let currentEmployee: NgTimecardEmployee | null = null;
	let currentDay: NgTimecardDay | null = null;

	const pushCurrentEmployee = () => {
		if (currentEmployee) {
			employees.push(currentEmployee);
		}

		currentEmployee = null;
		currentDay = null;
	};

	for (const rawRow of rows) {
		const row = rawRow.map(cellToString);
		const firstCell = row[0] ?? '';

		if (firstCell === 'Pay Period') {
			payPeriod = parseNgPayPeriod(row[3] ?? '');
			continue;
		}

		if (firstCell === 'Employee') {
			pushCurrentEmployee();

			const parsedEmployee = parseNgEmployeeCell(row[3] ?? '');

			if (!parsedEmployee || !payPeriod) {
				currentEmployee = null;
				continue;
			}

			currentEmployee = {
				displayName: parsedEmployee.displayName,
				employeeCode: parsedEmployee.employeeCode,
				payPeriodStart: payPeriod.start,
				payPeriodEnd: payPeriod.end,
				days: [],
				totalHours: null
			};
			continue;
		}

		if (firstCell === 'Date' && row[2] === 'IN') {
			continue;
		}

		if (firstCell === 'Total Hours') {
			if (currentEmployee) {
				currentEmployee.totalHours = row[5]?.trim() ? row[5].trim() : null;
			}

			pushCurrentEmployee();
			continue;
		}

		if (!currentEmployee) {
			continue;
		}

		const dateCell = row[1] ?? '';
		const isDateRow = DATE_PATTERN.test(dateCell);

		if (isDateRow) {
			currentDay = {
				date: dateCell,
				punches: [],
				dailyTotal: null,
				note: null
			};
			currentEmployee.days.push(currentDay);
		}

		if (!currentDay) {
			continue;
		}

		const punchIn = parseNgAmPmTimeTo24h(row[2] ?? '');
		const punchOut = parseNgAmPmTimeTo24h(row[3] ?? '');

		if (punchIn || punchOut) {
			currentDay.punches.push({ timeIn: punchIn, timeOut: punchOut });
		}

		if (row[5]?.trim()) {
			currentDay.dailyTotal = row[5].trim();
		}

		if (row[6]?.trim()) {
			currentDay.note = row[6].trim();
		}
	}

	pushCurrentEmployee();

	return { employees };
}
