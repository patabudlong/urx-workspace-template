import type {
	DtrHolidayCalendarDocument,
	DtrHolidayCalendarDto
} from '$lib/shared/models/dtr-holiday-calendar';
import { getDtrHolidayCalendarsCollection } from '$lib/server/db/collections';
import type { DtrHolidayCalendarInput } from '$lib/shared/dtr/schemas';
import {
	DTR_HOLIDAY_DEFAULT_RATES,
	defaultHolidayCalendarTitle,
	type DtrHolidayCalendarRates,
	type DtrHolidayEntry
} from '$lib/shared/dtr/holidays';
import { ObjectId } from 'mongodb';

let dtrHolidayCalendarIndexesPromise: Promise<void> | null = null;

const DTR_HOLIDAY_CALENDAR_PROJECTION = {
	workspaceId: 1,
	year: 1,
	title: 1,
	regularHoliday: 1,
	specialNonWorkingDay: 1,
	specialWorkingDay: 1,
	holidays: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toRates(doc: Pick<
	DtrHolidayCalendarDocument,
	'regularHoliday' | 'specialNonWorkingDay' | 'specialWorkingDay'
>): DtrHolidayCalendarRates {
	return {
		regularHoliday: doc.regularHoliday,
		specialNonWorkingDay: doc.specialNonWorkingDay,
		specialWorkingDay: doc.specialWorkingDay
	};
}

function toDtrHolidayCalendarDto(doc: DtrHolidayCalendarDocument): DtrHolidayCalendarDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		year: doc.year,
		title: doc.title,
		rates: toRates(doc),
		holidays: doc.holidays,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

export function createDefaultHolidayCalendarInput(year: number): DtrHolidayCalendarInput {
	return {
		year,
		title: defaultHolidayCalendarTitle(year),
		regularHoliday: { ...DTR_HOLIDAY_DEFAULT_RATES.regularHoliday },
		specialNonWorkingDay: { ...DTR_HOLIDAY_DEFAULT_RATES.specialNonWorkingDay },
		specialWorkingDay: { ...DTR_HOLIDAY_DEFAULT_RATES.specialWorkingDay },
		holidays: []
	};
}

export async function ensureDtrHolidayCalendarIndexes(): Promise<void> {
	if (!dtrHolidayCalendarIndexesPromise) {
		dtrHolidayCalendarIndexesPromise = (async () => {
			const collection = await getDtrHolidayCalendarsCollection();
			await collection.createIndex({ workspaceId: 1, year: 1 }, { unique: true });
		})();
	}

	await dtrHolidayCalendarIndexesPromise;
}

export async function getDtrHolidayCalendarForWorkspace(input: {
	workspaceId: string;
	year: number;
}): Promise<DtrHolidayCalendarDto | null> {
	await ensureDtrHolidayCalendarIndexes();

	const collection = await getDtrHolidayCalendarsCollection<DtrHolidayCalendarDocument>();
	const doc = await collection.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			year: input.year
		},
		{ projection: DTR_HOLIDAY_CALENDAR_PROJECTION }
	);

	return doc ? toDtrHolidayCalendarDto(doc) : null;
}

export async function listDtrHolidayCalendarsForWorkspace(
	workspaceId: string
): Promise<DtrHolidayCalendarDto[]> {
	await ensureDtrHolidayCalendarIndexes();

	const collection = await getDtrHolidayCalendarsCollection<DtrHolidayCalendarDocument>();
	const items = await collection
		.find({ workspaceId: new ObjectId(workspaceId) }, { projection: DTR_HOLIDAY_CALENDAR_PROJECTION })
		.sort({ year: -1 })
		.toArray();

	return items.map(toDtrHolidayCalendarDto);
}

export async function upsertDtrHolidayCalendarForWorkspace(input: {
	workspaceId: string;
	data: DtrHolidayCalendarInput;
}): Promise<DtrHolidayCalendarDto> {
	await ensureDtrHolidayCalendarIndexes();

	const collection = await getDtrHolidayCalendarsCollection<DtrHolidayCalendarDocument>();
	const now = new Date();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const holidays: DtrHolidayEntry[] = input.data.holidays.map((holiday) => ({
		date: holiday.date,
		name: holiday.name.trim(),
		category: holiday.category
	}));

	await collection.updateOne(
		{
			workspaceId: workspaceObjectId,
			year: input.data.year
		},
		{
			$set: {
				title: input.data.title.trim(),
				regularHoliday: input.data.regularHoliday,
				specialNonWorkingDay: input.data.specialNonWorkingDay,
				specialWorkingDay: input.data.specialWorkingDay,
				holidays,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				year: input.data.year,
				createdAt: now
			}
		},
		{ upsert: true }
	);

	const saved = await collection.findOne(
		{
			workspaceId: workspaceObjectId,
			year: input.data.year
		},
		{ projection: DTR_HOLIDAY_CALENDAR_PROJECTION }
	);

	if (!saved) {
		throw new Error('Failed to load saved holiday calendar');
	}

	return toDtrHolidayCalendarDto(saved);
}
