import type {
	DtrWorkScheduleDocument,
	DtrWorkScheduleDto
} from '$lib/shared/models/dtr-work-schedule';
import {
	getDtrWorkSchedulesCollection,
	getPayrollEmployeesCollection
} from '$lib/server/db/collections';
import type { DtrWorkSchedulesInput } from '$lib/shared/dtr/schemas';
import {
	normalizeLunchBreak,
	normalizeWorkScheduleDays,
	toWorkScheduleDto
} from '$lib/shared/dtr/work-schedule';
import { ObjectId } from 'mongodb';

let dtrWorkScheduleIndexesPromise: Promise<void> | null = null;

const DTR_WORK_SCHEDULE_PROJECTION = {
	workspaceId: 1,
	name: 1,
	days: 1,
	lunchBreakStart: 1,
	lunchBreakEnd: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function isValidObjectIdString(value: string): boolean {
	return ObjectId.isValid(value) && new ObjectId(value).toString() === value;
}

function toDtrWorkScheduleDto(doc: DtrWorkScheduleDocument): DtrWorkScheduleDto {
	return toWorkScheduleDto({
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		name: doc.name,
		days: doc.days,
		lunchBreakStart: doc.lunchBreakStart,
		lunchBreakEnd: doc.lunchBreakEnd,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	});
}

export async function ensureDtrWorkScheduleIndexes(): Promise<void> {
	if (!dtrWorkScheduleIndexesPromise) {
		dtrWorkScheduleIndexesPromise = (async () => {
			const collection = await getDtrWorkSchedulesCollection();
			await collection.createIndex({ workspaceId: 1, name: 1 });
		})();
	}

	await dtrWorkScheduleIndexesPromise;
}

export async function listDtrWorkSchedulesForWorkspace(
	workspaceId: string
): Promise<DtrWorkScheduleDto[]> {
	await ensureDtrWorkScheduleIndexes();

	const collection = await getDtrWorkSchedulesCollection<DtrWorkScheduleDocument>();
	const items = await collection
		.find({ workspaceId: new ObjectId(workspaceId) }, { projection: DTR_WORK_SCHEDULE_PROJECTION })
		.sort({ name: 1 })
		.toArray();

	return items.map(toDtrWorkScheduleDto);
}

export async function getDtrWorkScheduleForWorkspace(input: {
	workspaceId: string;
	scheduleId: string;
}): Promise<DtrWorkScheduleDto | null> {
	if (!isValidObjectIdString(input.scheduleId)) {
		return null;
	}

	await ensureDtrWorkScheduleIndexes();

	const collection = await getDtrWorkSchedulesCollection<DtrWorkScheduleDocument>();
	const doc = await collection.findOne(
		{
			_id: new ObjectId(input.scheduleId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: DTR_WORK_SCHEDULE_PROJECTION }
	);

	return doc ? toDtrWorkScheduleDto(doc) : null;
}

export function mapWorkSchedulesInputToDocument(
	schedules: DtrWorkSchedulesInput['schedules']
): Array<{
	id: string | null;
	name: string;
	days: DtrWorkScheduleDocument['days'];
	lunchBreakStart: string | null;
	lunchBreakEnd: string | null;
}> {
	return schedules.map((schedule) => {
		const lunchBreak = normalizeLunchBreak(schedule);

		return {
			id: isValidObjectIdString(schedule.id) ? schedule.id : null,
			name: schedule.name.trim(),
			days: normalizeWorkScheduleDays(schedule.days),
			lunchBreakStart: lunchBreak?.startTime ?? null,
			lunchBreakEnd: lunchBreak?.endTime ?? null
		};
	});
}

export function getWorkSchedulesFormDefaults(
	schedules: DtrWorkScheduleDto[]
): DtrWorkSchedulesInput {
	return {
		schedules: schedules.map((schedule) => ({
			id: schedule.id,
			name: schedule.name,
			days: schedule.days.map((day) => ({
				day: day.day,
				kind: day.kind,
				startTime: day.startTime ?? '',
				endTime: day.endTime ?? ''
			})),
			lunchBreakStart: schedule.lunchBreak?.startTime ?? '',
			lunchBreakEnd: schedule.lunchBreak?.endTime ?? ''
		}))
	};
}

export async function replaceDtrWorkSchedulesForWorkspace(input: {
	workspaceId: string;
	schedules: DtrWorkSchedulesInput['schedules'];
}): Promise<DtrWorkScheduleDto[]> {
	await ensureDtrWorkScheduleIndexes();

	const collection = await getDtrWorkSchedulesCollection<DtrWorkScheduleDocument>();
	const payrollEmployeesCollection = await getPayrollEmployeesCollection();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const now = new Date();

	const existing = await collection
		.find({ workspaceId: workspaceObjectId }, { projection: { _id: 1 } })
		.toArray();
	const existingIds = new Set(existing.map((doc) => doc._id.toString()));
	const retainedIds = new Set<string>();

	for (const schedule of mapWorkSchedulesInputToDocument(input.schedules)) {
		const scheduleObjectId = schedule.id ? new ObjectId(schedule.id) : new ObjectId();

		retainedIds.add(scheduleObjectId.toString());

		await collection.updateOne(
			{ _id: scheduleObjectId, workspaceId: workspaceObjectId },
			{
				$set: {
					name: schedule.name,
					days: schedule.days,
					lunchBreakStart: schedule.lunchBreakStart,
					lunchBreakEnd: schedule.lunchBreakEnd,
					updatedAt: now
				},
				$setOnInsert: {
					workspaceId: workspaceObjectId,
					createdAt: now
				}
			},
			{ upsert: true }
		);
	}

	const deletedIds = [...existingIds].filter((id) => !retainedIds.has(id));

	if (deletedIds.length > 0) {
		const deletedObjectIds = deletedIds.map((id) => new ObjectId(id));

		await collection.deleteMany({
			workspaceId: workspaceObjectId,
			_id: { $in: deletedObjectIds }
		});

		await payrollEmployeesCollection.updateMany(
			{
				workspaceId: workspaceObjectId,
				workScheduleId: { $in: deletedObjectIds }
			},
			{
				$set: {
					workScheduleId: null,
					updatedAt: now
				}
			}
		);
	}

	return listDtrWorkSchedulesForWorkspace(input.workspaceId);
}

export async function isDtrWorkScheduleInWorkspace(input: {
	workspaceId: string;
	scheduleId: string;
}): Promise<boolean> {
	const schedule = await getDtrWorkScheduleForWorkspace(input);
	return schedule !== null;
}
