import { getPmProjectFilesCollection } from '$lib/server/db/collections';
import type {
	PmProjectFileDocument,
	PmProjectFileDto,
	PmProjectFileUploadedBy
} from '$lib/shared/models/pm-project-file';
import { ObjectId } from 'mongodb';

let pmProjectFileIndexesPromise: Promise<void> | null = null;

const fileProjection = {
	_id: 1,
	workspaceId: 1,
	projectId: 1,
	checklistItemId: 1,
	storageKey: 1,
	originalFilename: 1,
	contentType: 1,
	sizeBytes: 1,
	uploadedBy: 1,
	uploadedByEmail: 1,
	uploadedByUserId: 1,
	invitationId: 1,
	isSeed: 1,
	createdAt: 1
} as const;

function toPmProjectFileDto(doc: PmProjectFileDocument): PmProjectFileDto {
	return {
		id: doc._id.toString(),
		checklistItemId: doc.checklistItemId.toString(),
		originalFilename: doc.originalFilename,
		contentType: doc.contentType,
		sizeBytes: doc.sizeBytes,
		uploadedBy: doc.uploadedBy,
		uploadedByEmail: doc.uploadedByEmail,
		createdAt: doc.createdAt.toISOString()
	};
}

export async function ensurePmProjectFileIndexes(): Promise<void> {
	if (!pmProjectFileIndexesPromise) {
		pmProjectFileIndexesPromise = (async () => {
			const collection = await getPmProjectFilesCollection();
			await collection.createIndex({ checklistItemId: 1, createdAt: -1 });
			await collection.createIndex({ workspaceId: 1, projectId: 1 });
		})();
	}

	await pmProjectFileIndexesPromise;
}

export async function listPmProjectFilesForChecklistItem(input: {
	workspaceId: string;
	projectId: string;
	checklistItemId: string;
}): Promise<PmProjectFileDto[]> {
	await ensurePmProjectFileIndexes();

	const collection = await getPmProjectFilesCollection<PmProjectFileDocument>();
	const docs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				projectId: new ObjectId(input.projectId),
				checklistItemId: new ObjectId(input.checklistItemId)
			},
			{ projection: fileProjection }
		)
		.sort({ createdAt: -1 })
		.toArray();

	return docs.map(toPmProjectFileDto);
}

export async function getPmProjectFileForWorkspace(input: {
	workspaceId: string;
	projectId: string;
	fileId: string;
}): Promise<PmProjectFileDocument | null> {
	await ensurePmProjectFileIndexes();

	const collection = await getPmProjectFilesCollection<PmProjectFileDocument>();
	return collection.findOne(
		{
			_id: new ObjectId(input.fileId),
			workspaceId: new ObjectId(input.workspaceId),
			projectId: new ObjectId(input.projectId)
		},
		{ projection: fileProjection }
	);
}

export async function createPmProjectFile(input: {
	workspaceId: string;
	projectId: string;
	checklistItemId: string;
	storageKey: string;
	originalFilename: string;
	contentType: string;
	sizeBytes: number;
	uploadedBy: PmProjectFileUploadedBy;
	uploadedByEmail: string | null;
	uploadedByUserId: string | null;
	invitationId: string | null;
	isSeed?: boolean;
}): Promise<PmProjectFileDto> {
	await ensurePmProjectFileIndexes();

	const now = new Date();
	const collection = await getPmProjectFilesCollection<PmProjectFileDocument>();

	const doc: PmProjectFileDocument = {
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId),
		checklistItemId: new ObjectId(input.checklistItemId),
		storageKey: input.storageKey,
		originalFilename: input.originalFilename,
		contentType: input.contentType,
		sizeBytes: input.sizeBytes,
		uploadedBy: input.uploadedBy,
		uploadedByEmail: input.uploadedByEmail,
		uploadedByUserId: input.uploadedByUserId ? new ObjectId(input.uploadedByUserId) : null,
		invitationId: input.invitationId ? new ObjectId(input.invitationId) : null,
		isSeed: input.isSeed,
		createdAt: now
	};

	await collection.insertOne(doc);
	return toPmProjectFileDto(doc);
}

export async function listPmProjectFileStorageKeysForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<string[]> {
	await ensurePmProjectFileIndexes();

	const collection = await getPmProjectFilesCollection<PmProjectFileDocument>();
	const docs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				projectId: new ObjectId(input.projectId)
			},
			{ projection: { storageKey: 1 } }
		)
		.toArray();

	return docs.map((doc) => doc.storageKey);
}

export async function deletePmProjectFilesForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<number> {
	await ensurePmProjectFileIndexes();

	const collection = await getPmProjectFilesCollection();
	const result = await collection.deleteMany({
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId)
	});

	return result.deletedCount;
}

export async function deletePmProjectFilesForChecklistItem(input: {
	workspaceId: string;
	projectId: string;
	checklistItemId: string;
}): Promise<string[]> {
	await ensurePmProjectFileIndexes();

	const collection = await getPmProjectFilesCollection<PmProjectFileDocument>();
	const docs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				projectId: new ObjectId(input.projectId),
				checklistItemId: new ObjectId(input.checklistItemId)
			},
			{ projection: { storageKey: 1 } }
		)
		.toArray();

	if (docs.length === 0) {
		return [];
	}

	await collection.deleteMany({
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId),
		checklistItemId: new ObjectId(input.checklistItemId)
	});

	return docs.map((doc) => doc.storageKey);
}
