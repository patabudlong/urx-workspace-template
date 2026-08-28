import {
	getPmDocumentChecklistItemsCollection,
	getPmProjectFilesCollection
} from '$lib/server/db/collections';
import type {
	PmDocumentChecklistItemDocument,
	PmDocumentChecklistItemDto,
	PmDocumentChecklistStatus
} from '$lib/shared/models/pm-document-checklist-item';
import { PM_DOCUMENT_CHECKLIST_STATUSES } from '$lib/shared/models/pm-document-checklist-item';
import { ObjectId } from 'mongodb';

let pmDocumentChecklistIndexesPromise: Promise<void> | null = null;

const itemProjection = {
	_id: 1,
	workspaceId: 1,
	projectId: 1,
	title: 1,
	description: 1,
	required: 1,
	dueDate: 1,
	sortOrder: 1,
	status: 1,
	submittedAt: 1,
	reviewedAt: 1,
	reviewedByUserId: 1,
	isSeed: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toPmDocumentChecklistItemDto(
	doc: PmDocumentChecklistItemDocument,
	fileCount = 0
): PmDocumentChecklistItemDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		projectId: doc.projectId.toString(),
		title: doc.title,
		description: doc.description,
		required: doc.required,
		dueDate: doc.dueDate?.toISOString() ?? null,
		sortOrder: doc.sortOrder,
		status: doc.status,
		submittedAt: doc.submittedAt?.toISOString() ?? null,
		reviewedAt: doc.reviewedAt?.toISOString() ?? null,
		fileCount,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

export async function ensurePmDocumentChecklistIndexes(): Promise<void> {
	if (!pmDocumentChecklistIndexesPromise) {
		pmDocumentChecklistIndexesPromise = (async () => {
			const collection = await getPmDocumentChecklistItemsCollection();
			await collection.createIndex({ workspaceId: 1, projectId: 1, sortOrder: 1 });
			await collection.createIndex({ projectId: 1, status: 1 });
		})();
	}

	await pmDocumentChecklistIndexesPromise;
}

async function countFilesByChecklistItemIds(
	checklistItemIds: ObjectId[]
): Promise<Map<string, number>> {
	if (checklistItemIds.length === 0) {
		return new Map();
	}

	const filesCollection = await getPmProjectFilesCollection();
	const counts = await filesCollection
		.aggregate<{ _id: ObjectId; count: number }>([
			{ $match: { checklistItemId: { $in: checklistItemIds } } },
			{ $group: { _id: '$checklistItemId', count: { $sum: 1 } } }
		])
		.toArray();

	return new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
}

export async function listPmDocumentChecklistItemsForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<PmDocumentChecklistItemDto[]> {
	await ensurePmDocumentChecklistIndexes();

	const collection =
		await getPmDocumentChecklistItemsCollection<PmDocumentChecklistItemDocument>();
	const docs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				projectId: new ObjectId(input.projectId)
			},
			{ projection: itemProjection }
		)
		.sort({ sortOrder: 1, createdAt: 1 })
		.toArray();

	const fileCounts = await countFilesByChecklistItemIds(docs.map((doc) => doc._id));

	return docs.map((doc) => toPmDocumentChecklistItemDto(doc, fileCounts.get(doc._id.toString()) ?? 0));
}

export async function getPmDocumentChecklistItemForProject(input: {
	workspaceId: string;
	projectId: string;
	itemId: string;
}): Promise<PmDocumentChecklistItemDocument | null> {
	await ensurePmDocumentChecklistIndexes();

	const collection =
		await getPmDocumentChecklistItemsCollection<PmDocumentChecklistItemDocument>();
	return collection.findOne(
		{
			_id: new ObjectId(input.itemId),
			workspaceId: new ObjectId(input.workspaceId),
			projectId: new ObjectId(input.projectId)
		},
		{ projection: itemProjection }
	);
}

export async function createPmDocumentChecklistItem(input: {
	workspaceId: string;
	projectId: string;
	title: string;
	description: string | null;
	required: boolean;
	dueDate: Date | null;
	sortOrder?: number;
	isSeed?: boolean;
}): Promise<PmDocumentChecklistItemDto> {
	await ensurePmDocumentChecklistIndexes();

	const now = new Date();
	const collection =
		await getPmDocumentChecklistItemsCollection<PmDocumentChecklistItemDocument>();

	let sortOrder = input.sortOrder;
	if (sortOrder === undefined) {
		const last = await collection.findOne(
			{
				workspaceId: new ObjectId(input.workspaceId),
				projectId: new ObjectId(input.projectId)
			},
			{ projection: { sortOrder: 1 }, sort: { sortOrder: -1 } }
		);
		sortOrder = (last?.sortOrder ?? -1) + 1;
	}

	const doc: PmDocumentChecklistItemDocument = {
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId),
		title: input.title.trim(),
		description: input.description,
		required: input.required,
		dueDate: input.dueDate,
		sortOrder,
		status: PM_DOCUMENT_CHECKLIST_STATUSES.PENDING,
		submittedAt: null,
		reviewedAt: null,
		reviewedByUserId: null,
		isSeed: input.isSeed,
		createdAt: now,
		updatedAt: now
	};

	await collection.insertOne(doc);
	return toPmDocumentChecklistItemDto(doc, 0);
}

export async function deletePmDocumentChecklistItem(input: {
	workspaceId: string;
	projectId: string;
	itemId: string;
}): Promise<boolean> {
	await ensurePmDocumentChecklistIndexes();

	const collection = await getPmDocumentChecklistItemsCollection();
	const result = await collection.deleteOne({
		_id: new ObjectId(input.itemId),
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId)
	});

	return result.deletedCount === 1;
}

export async function updatePmDocumentChecklistItemStatus(input: {
	workspaceId: string;
	projectId: string;
	itemId: string;
	status: PmDocumentChecklistStatus;
	reviewedByUserId?: string;
}): Promise<PmDocumentChecklistItemDto | null> {
	await ensurePmDocumentChecklistIndexes();

	const now = new Date();
	const collection =
		await getPmDocumentChecklistItemsCollection<PmDocumentChecklistItemDocument>();

	const update: Record<string, unknown> = {
		status: input.status,
		updatedAt: now
	};

	if (
		input.status === PM_DOCUMENT_CHECKLIST_STATUSES.APPROVED ||
		input.status === PM_DOCUMENT_CHECKLIST_STATUSES.REJECTED
	) {
		update.reviewedAt = now;
		update.reviewedByUserId = input.reviewedByUserId
			? new ObjectId(input.reviewedByUserId)
			: null;
	}

	const result = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.itemId),
			workspaceId: new ObjectId(input.workspaceId),
			projectId: new ObjectId(input.projectId)
		},
		{ $set: update },
		{ returnDocument: 'after', projection: itemProjection }
	);

	if (!result) {
		return null;
	}

	const fileCounts = await countFilesByChecklistItemIds([result._id]);
	return toPmDocumentChecklistItemDto(result, fileCounts.get(result._id.toString()) ?? 0);
}

export async function markPmDocumentChecklistItemSubmitted(input: {
	workspaceId: string;
	projectId: string;
	itemId: string;
}): Promise<PmDocumentChecklistItemDto | null> {
	await ensurePmDocumentChecklistIndexes();

	const now = new Date();
	const collection =
		await getPmDocumentChecklistItemsCollection<PmDocumentChecklistItemDocument>();

	const result = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.itemId),
			workspaceId: new ObjectId(input.workspaceId),
			projectId: new ObjectId(input.projectId)
		},
		{
			$set: {
				status: PM_DOCUMENT_CHECKLIST_STATUSES.SUBMITTED,
				submittedAt: now,
				updatedAt: now
			}
		},
		{ returnDocument: 'after', projection: itemProjection }
	);

	if (!result) {
		return null;
	}

	const fileCounts = await countFilesByChecklistItemIds([result._id]);
	return toPmDocumentChecklistItemDto(result, fileCounts.get(result._id.toString()) ?? 0);
}

export async function deletePmDocumentChecklistItemsForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<number> {
	await ensurePmDocumentChecklistIndexes();

	const collection = await getPmDocumentChecklistItemsCollection();
	const result = await collection.deleteMany({
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId)
	});

	return result.deletedCount;
}

export async function countPmDocumentChecklistItemsForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<number> {
	await ensurePmDocumentChecklistIndexes();

	const collection = await getPmDocumentChecklistItemsCollection();
	return collection.countDocuments({
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId)
	});
}
