import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';
import XLSX from 'xlsx';
import { loadEnvFile } from './load-env.ts';
import { resolveMongoDbName, resolveMongoUri } from '../src/lib/server/db/resolve-mongo-uri.ts';
import {
	computeDtrDayWorkedMinutes,
	type DtrLunchBreakWindow
} from '../src/lib/shared/dtr/calendar.ts';
import {
	buildNgTimecardImportRow,
	parseNgTimecardRows,
	type NgTimecardImportRow
} from '../src/lib/shared/dtr/ng-timecard.ts';
import { formatDtrNgImportDayTimes } from '../src/lib/shared/dtr/ng-timecard-import.ts';
import { isRestDay } from '../src/lib/shared/dtr/weekdays.ts';
import { isWorkScheduleRestDay } from '../src/lib/shared/dtr/work-schedule.ts';
import { dtrSettingsDefaults } from '../src/lib/shared/dtr/schemas.ts';
import type { DtrSettingsDocument } from '../src/lib/shared/models/dtr-settings.ts';
import type { DtrWorkScheduleDocument } from '../src/lib/shared/models/dtr-work-schedule.ts';
import type { PayrollEmployeeDocument } from '../src/lib/shared/models/payroll-employee.ts';
import { formatPayrollEmployeeFullName } from '../src/lib/shared/payroll/employee-name.ts';
import type { DtrLunchBreakWindow } from '../src/lib/shared/dtr/calendar.ts';

const COLLECTIONS = {
	payrollEmployees: 'payroll_employees',
	dtrSettings: 'dtr_settings',
	dtrWorkSchedules: 'dtr_work_schedules',
	dtrDays: 'dtr_days'
} as const;

type ScriptOptions = {
	workspaceId: string;
	filePath: string;
	dryRun: boolean;
	markAbsentOnEmpty: boolean;
};

type EmployeeContext = {
	id: string;
	employeeCode: string;
	displayName: string;
	workScheduleId: string | null;
};

function parseArgs(argv: string[]): ScriptOptions {
	let workspaceId = process.env.WORKSPACE_ID?.trim() ?? '';
	let filePath = '';
	let dryRun = false;
	let markAbsentOnEmpty = false;

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (arg === '--workspace-id' || arg === '-w') {
			workspaceId = argv[index + 1]?.trim() ?? '';
			index += 1;
			continue;
		}

		if (arg === '--file' || arg === '-f') {
			filePath = argv[index + 1]?.trim() ?? '';
			index += 1;
			continue;
		}

		if (arg === '--dry-run') {
			dryRun = true;
			continue;
		}

		if (arg === '--mark-absent') {
			markAbsentOnEmpty = true;
			continue;
		}
	}

	if (!workspaceId) {
		throw new Error('Workspace ID is required. Pass --workspace-id <id> or set WORKSPACE_ID.');
	}

	if (!ObjectId.isValid(workspaceId)) {
		throw new Error(`Invalid workspace ID: ${workspaceId}`);
	}

	if (!filePath) {
		throw new Error('File path is required. Pass --file <path-to-xls>.');
	}

	const resolvedPath = resolve(filePath);

	if (!existsSync(resolvedPath)) {
		throw new Error(`File not found: ${resolvedPath}`);
	}

	return {
		workspaceId,
		filePath: resolvedPath,
		dryRun,
		markAbsentOnEmpty
	};
}

function readNgTimecardRows(filePath: string): unknown[][] {
	const workbook = XLSX.readFile(filePath, { cellDates: true });
	const sheetName = workbook.SheetNames[0];

	if (!sheetName) {
		throw new Error('The spreadsheet has no sheets.');
	}

	const sheet = workbook.Sheets[sheetName];
	return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
}

async function loadEmployeeContexts(
	client: MongoClient,
	dbName: string,
	workspaceId: string
): Promise<Map<string, EmployeeContext>> {
	const collection = client
		.db(dbName)
		.collection<PayrollEmployeeDocument>(COLLECTIONS.payrollEmployees);

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
					initialName: 1,
					lastName: 1,
					employeeCode: 1,
					workScheduleId: 1
				}
			}
		)
		.toArray();

	const byCode = new Map<string, EmployeeContext>();

	for (const employee of employees) {
		const code = employee.employeeCode?.trim();

		if (!code) {
			continue;
		}

		byCode.set(code, {
			id: employee._id.toString(),
			employeeCode: code,
			displayName: formatPayrollEmployeeFullName({
				firstName: employee.firstName,
				initialName: employee.initialName,
				lastName: employee.lastName
			}),
			workScheduleId: employee.workScheduleId?.toString() ?? null
		});
	}

	return byCode;
}

async function loadWorkspaceRestDays(
	client: MongoClient,
	dbName: string,
	workspaceId: string
): Promise<string[]> {
	const collection = client
		.db(dbName)
		.collection<DtrSettingsDocument>(COLLECTIONS.dtrSettings);

	const settings = await collection.findOne(
		{ workspaceId: new ObjectId(workspaceId) },
		{ projection: { restDays: 1 } }
	);

	return settings?.restDays ?? dtrSettingsDefaults.restDays;
}

async function loadWorkSchedule(
	client: MongoClient,
	dbName: string,
	workspaceId: string,
	scheduleId: string
): Promise<DtrWorkScheduleDocument | null> {
	if (!ObjectId.isValid(scheduleId)) {
		return null;
	}

	const collection = client
		.db(dbName)
		.collection<DtrWorkScheduleDocument>(COLLECTIONS.dtrWorkSchedules);

	return collection.findOne({
		_id: new ObjectId(scheduleId),
		workspaceId: new ObjectId(workspaceId)
	});
}

async function resolveLunchBreakForDay(input: {
	client: MongoClient;
	dbName: string;
	workspaceId: string;
	employee: EmployeeContext;
	date: string;
	workspaceRestDays: string[];
	workSchedules: Map<string, DtrWorkScheduleDocument>;
}): Promise<DtrLunchBreakWindow | null> {
	const { employee, date, workspaceRestDays, workSchedules } = input;

	if (employee.workScheduleId) {
		const schedule =
			workSchedules.get(employee.workScheduleId) ??
			(await loadWorkSchedule(
				input.client,
				input.dbName,
				input.workspaceId,
				employee.workScheduleId
			));

		if (schedule) {
			workSchedules.set(employee.workScheduleId, schedule);

			const scheduleDto = {
				id: schedule._id.toString(),
				workspaceId: schedule.workspaceId.toString(),
				name: schedule.name,
				days: schedule.days,
				lunchBreak:
					schedule.lunchBreakStart && schedule.lunchBreakEnd
						? {
								startTime: schedule.lunchBreakStart,
								endTime: schedule.lunchBreakEnd
							}
						: null,
				createdAt: schedule.createdAt.toISOString(),
				updatedAt: schedule.updatedAt.toISOString()
			};

			if (isWorkScheduleRestDay(scheduleDto, date)) {
				return null;
			}

			return scheduleDto.lunchBreak;
		}
	}

	if (isRestDay(date, workspaceRestDays as Parameters<typeof isRestDay>[1])) {
		return null;
	}

	const settingsCollection = input.client
		.db(input.dbName)
		.collection<DtrSettingsDocument>(COLLECTIONS.dtrSettings);

	const settings = await settingsCollection.findOne(
		{ workspaceId: new ObjectId(input.workspaceId) },
		{ projection: { lunchBreakStart: 1, lunchBreakEnd: 1 } }
	);

	if (settings?.lunchBreakStart && settings?.lunchBreakEnd) {
		return {
			startTime: settings.lunchBreakStart,
			endTime: settings.lunchBreakEnd
		};
	}

	const defaults = dtrSettingsDefaults;

	if (defaults.lunchBreakStart && defaults.lunchBreakEnd) {
		return {
			startTime: defaults.lunchBreakStart,
			endTime: defaults.lunchBreakEnd
		};
	}

	return null;
}

async function isRestDayForEmployee(input: {
	client: MongoClient;
	dbName: string;
	workspaceId: string;
	employee: EmployeeContext;
	date: string;
	workspaceRestDays: string[];
	workSchedules: Map<string, DtrWorkScheduleDocument>;
}): Promise<boolean> {
	const { employee, date, workspaceRestDays, workSchedules } = input;

	if (employee.workScheduleId) {
		const schedule =
			workSchedules.get(employee.workScheduleId) ??
			(await loadWorkSchedule(
				input.client,
				input.dbName,
				input.workspaceId,
				employee.workScheduleId
			));

		if (schedule) {
			workSchedules.set(employee.workScheduleId, schedule);

			const scheduleDto = {
				id: schedule._id.toString(),
				workspaceId: schedule.workspaceId.toString(),
				name: schedule.name,
				days: schedule.days,
				lunchBreak:
					schedule.lunchBreakStart && schedule.lunchBreakEnd
						? {
								startTime: schedule.lunchBreakStart,
								endTime: schedule.lunchBreakEnd
							}
						: null,
				createdAt: schedule.createdAt.toISOString(),
				updatedAt: schedule.updatedAt.toISOString()
			};

			return isWorkScheduleRestDay(scheduleDto, date);
		}
	}

	return isRestDay(date, workspaceRestDays as Parameters<typeof isRestDay>[1]);
}

async function upsertDtrDay(input: {
	client: MongoClient;
	dbName: string;
	workspaceId: string;
	employeeId: string;
	row: NgTimecardImportRow;
	lunchBreak: DtrLunchBreakWindow | null;
}): Promise<void> {
	const collection = input.client.db(input.dbName).collection(COLLECTIONS.dtrDays);
	const now = new Date();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const employeeObjectId = new ObjectId(input.employeeId);
	const punchInput = {
		timeIn: input.row.timeIn,
		timeOut: input.row.timeOut,
		morningTimeIn: input.row.morningTimeIn,
		morningTimeOut: input.row.morningTimeOut,
		afternoonTimeIn: input.row.afternoonTimeIn,
		afternoonTimeOut: input.row.afternoonTimeOut
	};
	const workedMinutes = computeDtrDayWorkedMinutes(punchInput, input.lunchBreak);

	await collection.updateOne(
		{
			workspaceId: workspaceObjectId,
			employeeId: employeeObjectId,
			date: input.row.date
		},
		{
			$set: {
				status: input.row.status,
				timeIn: input.row.timeIn,
				timeOut: input.row.timeOut,
				morningTimeIn: input.row.morningTimeIn,
				morningTimeOut: input.row.morningTimeOut,
				afternoonTimeIn: input.row.afternoonTimeIn,
				afternoonTimeOut: input.row.afternoonTimeOut,
				workedMinutes,
				source: 'biometric',
				approvalStatus: 'draft',
				notes: input.row.notes,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				employeeId: employeeObjectId,
				date: input.row.date,
				createdAt: now
			}
		},
		{ upsert: true }
	);
}

function formatRowPreview(row: NgTimecardImportRow, employeeName: string): string {
	const times = formatDtrNgImportDayTimes(row);
	const notes = row.notes ? ` (${row.notes})` : '';

	return `  ${row.date}  ${employeeName} [${row.employeeCode}]  ${row.status}  ${times}${notes}`;
}

async function main() {
	const envPath = loadEnvFile();

	if (!envPath) {
		console.warn('No .env file found — using process environment.');
	}

	const options = parseArgs(process.argv.slice(2));
	const { target, uri } = resolveMongoUri(process.env);
	const dbName = resolveMongoDbName(process.env);

	if (!uri) {
		console.error(
			`MongoDB URI for target "${target}" is not set. Copy .env.example to .env and set MONGODB_URI_LOCAL / MONGODB_URI_ATLAS.`
		);
		process.exit(1);
	}

	const rows = readNgTimecardRows(options.filePath);
	const report = parseNgTimecardRows(rows);

	if (report.employees.length === 0) {
		console.error('No employee timecard sections found in the file.');
		process.exit(1);
	}

	console.log(`NG timecard: ${options.filePath}`);
	console.log(`Workspace: ${options.workspaceId}  |  DB: ${dbName} (${target})`);
	console.log(
		`Mode: ${options.dryRun ? 'dry-run (no writes)' : 'import'}  |  mark-absent: ${options.markAbsentOnEmpty}`
	);
	console.log(`Employees in file: ${report.employees.length}`);

	const client = new MongoClient(uri);

	try {
		await client.connect();

		const employeeByCode = await loadEmployeeContexts(client, dbName, options.workspaceId);
		const workspaceRestDays = await loadWorkspaceRestDays(client, dbName, options.workspaceId);
		const workSchedules = new Map<string, DtrWorkScheduleDocument>();

		let imported = 0;
		let skipped = 0;
		const unmatchedCodes = new Set<string>();
		const warnings: string[] = [];

		for (const employeeSection of report.employees) {
			const employee = employeeByCode.get(employeeSection.employeeCode);

			if (!employee) {
				unmatchedCodes.add(employeeSection.employeeCode);
				warnings.push(
					`No payroll employee with code ${employeeSection.employeeCode} (${employeeSection.displayName}).`
				);

				if (options.dryRun) {
					for (const day of employeeSection.days) {
						const isRest = isRestDay(
							day.date,
							workspaceRestDays as Parameters<typeof isRestDay>[1]
						);
						const importRow = buildNgTimecardImportRow(employeeSection.employeeCode, day, {
							isRestDay: isRest,
							markAbsentOnEmpty: options.markAbsentOnEmpty
						});

						if (!importRow) {
							skipped += 1;
							continue;
						}

						console.log(
							formatRowPreview(importRow, `${employeeSection.displayName} (unmatched)`)
						);
						imported += 1;
					}
				}

				continue;
			}

			if (employee.displayName !== employeeSection.displayName) {
				warnings.push(
					`Name mismatch for ${employeeSection.employeeCode}: file="${employeeSection.displayName}" payroll="${employee.displayName}".`
				);
			}

			for (const day of employeeSection.days) {
				const isRest = await isRestDayForEmployee({
					client,
					dbName,
					workspaceId: options.workspaceId,
					employee,
					date: day.date,
					workspaceRestDays,
					workSchedules
				});

				const importRow = buildNgTimecardImportRow(employeeSection.employeeCode, day, {
					isRestDay: isRest,
					markAbsentOnEmpty: options.markAbsentOnEmpty
				});

				if (!importRow) {
					skipped += 1;
					continue;
				}

				console.log(formatRowPreview(importRow, employee.displayName));

				if (!options.dryRun) {
					const lunchBreak = await resolveLunchBreakForDay({
						client,
						dbName,
						workspaceId: options.workspaceId,
						employee,
						date: importRow.date,
						workspaceRestDays,
						workSchedules
					});

					await upsertDtrDay({
						client,
						dbName,
						workspaceId: options.workspaceId,
						employeeId: employee.id,
						row: importRow,
						lunchBreak
					});
				}

				imported += 1;
			}
		}

		console.log('');
		console.log(`Imported: ${imported}  |  Skipped (empty/rest): ${skipped}`);

		if (unmatchedCodes.size > 0) {
			console.log(`Unmatched codes: ${[...unmatchedCodes].join(', ')}`);
		}

		if (warnings.length > 0) {
			console.log('');
			console.log('Warnings:');
			for (const warning of warnings) {
				console.log(`  - ${warning}`);
			}
		}

		if (options.dryRun) {
			console.log('');
			console.log('Dry run complete — no records were written.');
		}
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
