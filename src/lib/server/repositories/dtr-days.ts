import type { DtrDayDocument, DtrDayDto } from '$lib/shared/models/dtr-day';
import type { PayrollRunDocument } from '$lib/shared/models/payroll-run';
import { getDtrDaysCollection, getPayrollRunsCollection } from '$lib/server/db/collections';
import {
	loadDtrHolidayContextForWorkspace,
	resolveHolidayFieldsForDay,
	type DtrHolidayContext
} from '$lib/server/dtr/holidays';
import { resolveLunchBreakForEmployeeDay } from '$lib/server/dtr/lunch-break';
import { DtrDayLockedError } from '$lib/server/dtr/errors';
import { computeWorkedMinutes } from '$lib/shared/dtr/calendar';
import { enrichDtrDayWithHolidayCredit } from '$lib/shared/dtr/holidays';
import type { UpsertDtrDayInput } from '$lib/shared/dtr/schemas';
import { ObjectId } from 'mongodb';

let dtrDayIndexesPromise: Promise<void> | null = null;

const DTR_DAY_PROJECTION = {
	workspaceId: 1,
	employeeId: 1,
	date: 1,
	status: 1,
	timeIn: 1,
	timeOut: 1,
	workedMinutes: 1,
	source: 1,
	approvalStatus: 1,
	notes: 1,
	holidayCategory: 1,
	holidayName: 1,
	holidayWorked: 1,
	holidayPayPercent: 1,
	lockedByRunId: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toDtrDayDto(doc: DtrDayDocument): DtrDayDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		employeeId: doc.employeeId.toString(),
		date: doc.date,
		status: doc.status,
		timeIn: doc.timeIn,
		timeOut: doc.timeOut,
		workedMinutes: doc.workedMinutes,
		source: doc.source,
		approvalStatus: doc.approvalStatus,
		notes: doc.notes,
		holidayCategory: doc.holidayCategory ?? null,
		holidayName: doc.holidayName ?? null,
		holidayWorked: doc.holidayWorked ?? null,
		holidayPayPercent: doc.holidayPayPercent ?? null,
		lockedByRunId: doc.lockedByRunId?.toString() ?? null,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

function enrichDtrDayDto(day: DtrDayDto, context: DtrHolidayContext | null): DtrDayDto {
	if (!context) {
		return day;
	}

	const holiday = context.byDate.get(day.date);

	if (!holiday) {
		return {
			...day,
			holidayCategory: null,
			holidayName: null,
			holidayWorked: null,
			holidayPayPercent: null
		};
	}

	return enrichDtrDayWithHolidayCredit(day, holiday, context.rates);
}

async function loadHolidayContextsForDateRange(input: {
	workspaceId: string;
	startDate: string;
	endDate: string;
}): Promise<Map<number, DtrHolidayContext | null>> {
	const startYear = Number(input.startDate.slice(0, 4));
	const endYear = Number(input.endDate.slice(0, 4));
	const contexts = new Map<number, DtrHolidayContext | null>();

	for (let year = startYear; year <= endYear; year += 1) {
		contexts.set(
			year,
			await loadDtrHolidayContextForWorkspace({
				workspaceId: input.workspaceId,
				year
			})
		);
	}

	return contexts;
}

export async function ensureDtrDayIndexes(): Promise<void> {
	if (!dtrDayIndexesPromise) {
		dtrDayIndexesPromise = (async () => {
			const collection = await getDtrDaysCollection();
			await collection.createIndex(
				{ workspaceId: 1, employeeId: 1, date: 1 },
				{ unique: true }
			);
			await collection.createIndex({ workspaceId: 1, date: 1 });
		})();
	}

	await dtrDayIndexesPromise;
}

export async function listDtrDaysForWorkspace(input: {
	workspaceId: string;
	startDate: string;
	endDate: string;
	employeeId?: string;
}): Promise<DtrDayDto[]> {
	await ensureDtrDayIndexes();

	const collection = await getDtrDaysCollection<DtrDayDocument>();
	const filter: Record<string, unknown> = {
		workspaceId: new ObjectId(input.workspaceId),
		date: { $gte: input.startDate, $lte: input.endDate }
	};

	if (input.employeeId) {
		filter.employeeId = new ObjectId(input.employeeId);
	}

	const items = await collection
		.find(filter, { projection: DTR_DAY_PROJECTION })
		.sort({ date: 1 })
		.toArray();

	const holidayContexts = await loadHolidayContextsForDateRange({
		workspaceId: input.workspaceId,
		startDate: input.startDate,
		endDate: input.endDate
	});

	return items.map((doc) => {
		const dto = toDtrDayDto(doc);
		const year = Number(dto.date.slice(0, 4));
		return enrichDtrDayDto(dto, holidayContexts.get(year) ?? null);
	});
}

function parseDtrCalendarDate(value: string): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

export async function isDtrDateInCompletedPayPeriod(input: {
	workspaceId: string;
	date: string;
}): Promise<boolean> {
	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	const dateValue = parseDtrCalendarDate(input.date);

	const run = await collection.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			status: 'completed',
			periodStart: { $lte: dateValue },
			periodEnd: { $gte: dateValue }
		},
		{ projection: { _id: 1 } }
	);

	return Boolean(run);
}

export async function upsertDtrDayForWorkspace(input: {
	workspaceId: string;
	data: UpsertDtrDayInput;
}): Promise<DtrDayDto> {
	await ensureDtrDayIndexes();

	const collection = await getDtrDaysCollection<DtrDayDocument>();
	const now = new Date();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const employeeObjectId = new ObjectId(input.data.employeeId);

	const existing = await collection.findOne(
		{
			workspaceId: workspaceObjectId,
			employeeId: employeeObjectId,
			date: input.data.date
		},
		{ projection: { lockedByRunId: 1 } }
	);

	if (existing?.lockedByRunId) {
		throw new DtrDayLockedError();
	}

	if (await isDtrDateInCompletedPayPeriod({
		workspaceId: input.workspaceId,
		date: input.data.date
	})) {
		throw new DtrDayLockedError();
	}

	const timeIn = input.data.timeIn?.trim() ? input.data.timeIn.trim() : null;
	const timeOut = input.data.timeOut?.trim() ? input.data.timeOut.trim() : null;
	const notes = input.data.notes?.trim() ? input.data.notes.trim() : null;
	const lunchBreak = await resolveLunchBreakForEmployeeDay({
		workspaceId: input.workspaceId,
		employeeId: input.data.employeeId,
		date: input.data.date
	});
	const workedMinutes = computeWorkedMinutes(timeIn, timeOut, lunchBreak);
	const year = Number(input.data.date.slice(0, 4));
	const holidayContext = await loadDtrHolidayContextForWorkspace({
		workspaceId: input.workspaceId,
		year
	});
	const holidayFields = resolveHolidayFieldsForDay({
		context: holidayContext,
		date: input.data.date,
		status: input.data.status,
		timeIn,
		timeOut,
		workedMinutes
	});

	await collection.updateOne(
		{
			workspaceId: workspaceObjectId,
			employeeId: employeeObjectId,
			date: input.data.date
		},
		{
			$set: {
				status: input.data.status,
				timeIn,
				timeOut,
				workedMinutes,
				source: input.data.source,
				approvalStatus: 'draft',
				notes,
				holidayCategory: holidayFields.holidayCategory,
				holidayName: holidayFields.holidayName,
				holidayWorked: holidayFields.holidayWorked,
				holidayPayPercent: holidayFields.holidayPayPercent,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				employeeId: employeeObjectId,
				date: input.data.date,
				createdAt: now
			}
		},
		{ upsert: true }
	);

	const saved = await collection.findOne(
		{
			workspaceId: workspaceObjectId,
			employeeId: employeeObjectId,
			date: input.data.date
		},
		{ projection: DTR_DAY_PROJECTION }
	);

	if (!saved) {
		throw new Error('Failed to load saved DTR day');
	}

	return enrichDtrDayDto(toDtrDayDto(saved), holidayContext);
}

export async function lockDtrDaysForPayPeriod(input: {
	workspaceId: string;
	startDate: string;
	endDate: string;
	runId: string;
}): Promise<number> {
	await ensureDtrDayIndexes();

	if (!ObjectId.isValid(input.runId)) {
		return 0;
	}

	const collection = await getDtrDaysCollection<DtrDayDocument>();
	const now = new Date();
	const runObjectId = new ObjectId(input.runId);

	const result = await collection.updateMany(
		{
			workspaceId: new ObjectId(input.workspaceId),
			date: { $gte: input.startDate, $lte: input.endDate },
			$or: [{ lockedByRunId: null }, { lockedByRunId: { $exists: false } }]
		},
		{
			$set: {
				approvalStatus: 'approved',
				lockedByRunId: runObjectId,
				updatedAt: now
			}
		}
	);

	return result.modifiedCount;
}

export async function unlockDtrDaysForPayRun(input: {
	workspaceId: string;
	runId: string;
}): Promise<number> {
	await ensureDtrDayIndexes();

	if (!ObjectId.isValid(input.runId)) {
		return 0;
	}

	const collection = await getDtrDaysCollection<DtrDayDocument>();
	const now = new Date();

	const result = await collection.updateMany(
		{
			workspaceId: new ObjectId(input.workspaceId),
			lockedByRunId: new ObjectId(input.runId)
		},
		{
			$set: {
				approvalStatus: 'draft',
				lockedByRunId: null,
				updatedAt: now
			}
		}
	);

	return result.modifiedCount;
}
