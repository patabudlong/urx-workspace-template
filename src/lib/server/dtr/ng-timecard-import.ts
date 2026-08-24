import type { Cookies } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import XLSX from 'xlsx';
import { getPayrollEmployeesCollection } from '$lib/server/db/collections';
import { getDtrSettingsForWorkspace } from '$lib/server/repositories/dtr-settings';
import { getDtrWorkScheduleForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import { upsertDtrDayForWorkspace } from '$lib/server/repositories/dtr-days';
import { isDtrDayLockedError } from '$lib/server/dtr/errors';
import type { PayrollEmployeeDocument } from '$lib/shared/models/payroll-employee';
import type { DtrWorkScheduleDto } from '$lib/shared/models/dtr-work-schedule';
import {
	buildNgTimecardImportRow,
	parseNgTimecardRows,
	type NgTimecardReport
} from '$lib/shared/dtr/ng-timecard';
import {
	DTR_NG_IMPORT_PREVIEW_COOKIE,
	DTR_NG_IMPORT_PREVIEW_MAX_AGE_SECONDS,
	type DtrNgImportPreview,
	type DtrNgImportPreviewRow
} from '$lib/shared/dtr/ng-timecard-import';
import { isRestDay } from '$lib/shared/dtr/weekdays';
import { isWorkScheduleRestDay } from '$lib/shared/dtr/work-schedule';

type EmployeeByCode = {
	id: string;
	displayName: string;
	workScheduleId: string | null;
};

export function parseNgTimecardBuffer(buffer: Buffer): NgTimecardReport {
	const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
	const sheetName = workbook.SheetNames[0];

	if (!sheetName) {
		throw new Error('The spreadsheet has no sheets.');
	}

	const sheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

	return parseNgTimecardRows(rows);
}

export function readDtrNgImportPreviewCookie(
	cookies: Cookies,
	workspaceId: string
): DtrNgImportPreview | null {
	const raw = cookies.get(DTR_NG_IMPORT_PREVIEW_COOKIE);

	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as DtrNgImportPreview;

		if (parsed.workspaceId !== workspaceId || !Array.isArray(parsed.rows)) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

export function writeDtrNgImportPreviewCookie(cookies: Cookies, preview: DtrNgImportPreview): void {
	cookies.set(DTR_NG_IMPORT_PREVIEW_COOKIE, JSON.stringify(preview), {
		path: '/dtr/import',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: DTR_NG_IMPORT_PREVIEW_MAX_AGE_SECONDS
	});
}

export function clearDtrNgImportPreviewCookie(cookies: Cookies): void {
	cookies.delete(DTR_NG_IMPORT_PREVIEW_COOKIE, { path: '/dtr/import' });
}

async function loadEmployeesByCode(workspaceId: string): Promise<Map<string, EmployeeByCode>> {
	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const employees = await collection
		.find(
			{
				workspaceId: new ObjectId(workspaceId),
				isActive: true,
				employeeCode: { $type: 'string' }
			},
			{
				projection: {
					firstName: 1,
					lastName: 1,
					employeeCode: 1,
					workScheduleId: 1
				}
			}
		)
		.toArray();

	const byCode = new Map<string, EmployeeByCode>();

	for (const employee of employees) {
		const code = employee.employeeCode?.trim();

		if (!code) {
			continue;
		}

		byCode.set(code, {
			id: employee._id.toString(),
			displayName: `${employee.firstName} ${employee.lastName}`.trim(),
			workScheduleId: employee.workScheduleId?.toString() ?? null
		});
	}

	return byCode;
}

async function loadWorkScheduleDto(
	workspaceId: string,
	scheduleId: string,
	cache: Map<string, DtrWorkScheduleDto | null>
): Promise<DtrWorkScheduleDto | null> {
	if (cache.has(scheduleId)) {
		return cache.get(scheduleId) ?? null;
	}

	const schedule = await getDtrWorkScheduleForWorkspace({
		workspaceId,
		scheduleId
	});
	cache.set(scheduleId, schedule);
	return schedule;
}

async function isRestDayForEmployee(input: {
	workspaceId: string;
	employee: EmployeeByCode;
	date: string;
	workspaceRestDays: string[];
	workSchedules: Map<string, DtrWorkScheduleDto | null>;
}): Promise<boolean> {
	const { employee, date, workspaceRestDays, workSchedules } = input;

	if (employee.workScheduleId) {
		const schedule = await loadWorkScheduleDto(
			input.workspaceId,
			employee.workScheduleId,
			workSchedules
		);

		if (schedule) {
			return isWorkScheduleRestDay(schedule, date);
		}
	}

	return isRestDay(date, workspaceRestDays as Parameters<typeof isRestDay>[1]);
}

export async function buildDtrNgImportPreview(input: {
	workspaceId: string;
	report: NgTimecardReport;
	markAbsentOnEmpty: boolean;
}): Promise<DtrNgImportPreview> {
	const employeesByCode = await loadEmployeesByCode(input.workspaceId);
	const settings = await getDtrSettingsForWorkspace(input.workspaceId);
	const workSchedules = new Map<string, DtrWorkScheduleDto | null>();
	const warnings: string[] = [];
	const rows: DtrNgImportPreviewRow[] = [];
	let skippedCount = 0;
	const unmatchedCodes = new Set<string>();

	let payPeriodStart = '';
	let payPeriodEnd = '';

	for (const employeeSection of input.report.employees) {
		if (!payPeriodStart) {
			payPeriodStart = employeeSection.payPeriodStart;
			payPeriodEnd = employeeSection.payPeriodEnd;
		}

		const employee = employeesByCode.get(employeeSection.employeeCode);

		if (!employee) {
			unmatchedCodes.add(employeeSection.employeeCode);
			warnings.push(
				`No payroll employee with code ${employeeSection.employeeCode} (${employeeSection.displayName}).`
			);
			continue;
		}

		if (employee.displayName !== employeeSection.displayName) {
			warnings.push(
				`Name mismatch for ${employeeSection.employeeCode}: file="${employeeSection.displayName}" payroll="${employee.displayName}".`
			);
		}

		for (const day of employeeSection.days) {
			const isRest = await isRestDayForEmployee({
				workspaceId: input.workspaceId,
				employee,
				date: day.date,
				workspaceRestDays: settings.restDays,
				workSchedules
			});

			const importRow = buildNgTimecardImportRow(employeeSection.employeeCode, day, {
				isRestDay: isRest,
				markAbsentOnEmpty: input.markAbsentOnEmpty
			});

			if (!importRow) {
				skippedCount += 1;
				continue;
			}

			rows.push({
				employeeId: employee.id,
				employeeName: employee.displayName,
				employeeCode: employeeSection.employeeCode,
				fileEmployeeName: employeeSection.displayName,
				date: importRow.date,
				status: importRow.status,
				timeIn: importRow.timeIn,
				timeOut: importRow.timeOut,
				morningTimeIn: importRow.morningTimeIn,
				morningTimeOut: importRow.morningTimeOut,
				afternoonTimeIn: importRow.afternoonTimeIn,
				afternoonTimeOut: importRow.afternoonTimeOut,
				notes: importRow.notes
			});
		}
	}

	if (unmatchedCodes.size > 0) {
		warnings.push(`Unmatched employee codes: ${[...unmatchedCodes].join(', ')}.`);
	}

	return {
		workspaceId: input.workspaceId,
		payPeriodStart,
		payPeriodEnd,
		employeeCount: input.report.employees.length,
		rows,
		warnings,
		skippedCount
	};
}

export async function importDtrNgPreviewRows(input: {
	workspaceId: string;
	rows: DtrNgImportPreviewRow[];
}): Promise<number> {
	let imported = 0;

	for (const row of input.rows) {
		try {
			await upsertDtrDayForWorkspace({
				workspaceId: input.workspaceId,
				data: {
					employeeId: row.employeeId,
					date: row.date,
					status: row.status,
					timeIn: row.timeIn ?? '',
					timeOut: row.timeOut ?? '',
					morningTimeIn: row.morningTimeIn ?? '',
					morningTimeOut: row.morningTimeOut ?? '',
					afternoonTimeIn: row.afternoonTimeIn ?? '',
					afternoonTimeOut: row.afternoonTimeOut ?? '',
					source: 'biometric',
					notes: row.notes ?? ''
				}
			});
			imported += 1;
		} catch (error) {
			if (isDtrDayLockedError(error)) {
				continue;
			}

			throw error;
		}
	}

	return imported;
}
