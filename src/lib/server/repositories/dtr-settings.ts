import type { DtrSettingsDocument, DtrSettingsDto } from '$lib/shared/models/dtr-settings';
import { getDtrSettingsCollection } from '$lib/server/db/collections';
import type { DtrSettingsInput } from '$lib/shared/dtr/schemas';
import { dtrSettingsDefaults } from '$lib/shared/dtr/schemas';
import { sortWeekDays } from '$lib/shared/dtr/weekdays';
import { ObjectId } from 'mongodb';

let dtrSettingsIndexesPromise: Promise<void> | null = null;

const DTR_SETTINGS_PROJECTION = {
	workspaceId: 1,
	restDays: 1,
	standardWorkMinutes: 1,
	updatedAt: 1
} as const;

function toDtrSettingsDto(doc: DtrSettingsDocument | null, workspaceId: string): DtrSettingsDto {
	if (!doc) {
		return {
			workspaceId,
			restDays: dtrSettingsDefaults.restDays,
			standardWorkMinutes: dtrSettingsDefaults.standardWorkMinutes,
			configured: false,
			updatedAt: null
		};
	}

	return {
		workspaceId: doc.workspaceId.toString(),
		restDays: sortWeekDays(doc.restDays),
		standardWorkMinutes: doc.standardWorkMinutes,
		configured: true,
		updatedAt: doc.updatedAt.toISOString()
	};
}

export async function ensureDtrSettingsIndexes(): Promise<void> {
	if (!dtrSettingsIndexesPromise) {
		dtrSettingsIndexesPromise = (async () => {
			const collection = await getDtrSettingsCollection();
			await collection.createIndex({ workspaceId: 1 }, { unique: true });
		})();
	}

	await dtrSettingsIndexesPromise;
}

export async function getDtrSettingsForWorkspace(workspaceId: string): Promise<DtrSettingsDto> {
	await ensureDtrSettingsIndexes();

	const collection = await getDtrSettingsCollection<DtrSettingsDocument>();
	const doc = await collection.findOne(
		{ workspaceId: new ObjectId(workspaceId) },
		{ projection: DTR_SETTINGS_PROJECTION }
	);

	return toDtrSettingsDto(doc, workspaceId);
}

export async function upsertDtrSettingsForWorkspace(input: {
	workspaceId: string;
	data: DtrSettingsInput;
}): Promise<DtrSettingsDto> {
	await ensureDtrSettingsIndexes();

	const collection = await getDtrSettingsCollection<DtrSettingsDocument>();
	const now = new Date();
	const workspaceObjectId = new ObjectId(input.workspaceId);

	await collection.updateOne(
		{ workspaceId: workspaceObjectId },
		{
			$set: {
				restDays: sortWeekDays(input.data.restDays),
				standardWorkMinutes: input.data.standardWorkMinutes,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				createdAt: now
			}
		},
		{ upsert: true }
	);

	return getDtrSettingsForWorkspace(input.workspaceId);
}
