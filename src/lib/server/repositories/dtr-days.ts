import type { DtrDayDocument, DtrDayDto } from '$lib/shared/models/dtr-day';
import { getDtrDaysCollection } from '$lib/server/db/collections';
import { resolveLunchBreakForEmployeeDay } from '$lib/server/dtr/lunch-break';
import { computeWorkedMinutes } from '$lib/shared/dtr/calendar';
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
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
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

	return items.map(toDtrDayDto);
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
	const timeIn = input.data.timeIn?.trim() ? input.data.timeIn.trim() : null;
	const timeOut = input.data.timeOut?.trim() ? input.data.timeOut.trim() : null;
	const notes = input.data.notes?.trim() ? input.data.notes.trim() : null;
	const lunchBreak = await resolveLunchBreakForEmployeeDay({
		workspaceId: input.workspaceId,
		employeeId: input.data.employeeId,
		date: input.data.date
	});
	const workedMinutes = computeWorkedMinutes(timeIn, timeOut, lunchBreak);

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

	return toDtrDayDto(saved);
}
