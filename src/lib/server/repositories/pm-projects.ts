import type { PmProjectDocument, PmProjectDto } from '$lib/shared/models/pm-project';
import { PM_PROJECT_STATUSES } from '$lib/shared/models/pm-project';
import { getPmProjectsCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';
import type { CreatePmProjectInput, UpdatePmProjectInput } from '$lib/shared/project-management/schemas';

let pmProjectIndexesPromise: Promise<void> | null = null;

const PM_PROJECT_PROJECTION = {
	_id: 1,
	workspaceId: 1,
	title: 1,
	description: 1,
	status: 1,
	clientName: 1,
	websiteUrl: 1,
	crmCompanyId: 1,
	crmContactId: 1,
	dueDate: 1,
	notes: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toPmProjectDto(doc: PmProjectDocument): PmProjectDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		title: doc.title,
		description: doc.description,
		status: doc.status,
		clientName: doc.clientName,
		websiteUrl: doc.websiteUrl,
		crmCompanyId: doc.crmCompanyId?.toString() ?? null,
		crmContactId: doc.crmContactId?.toString() ?? null,
		dueDate: doc.dueDate?.toISOString() ?? null,
		notes: doc.notes,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

async function ensurePmProjectIndexes(): Promise<void> {
	if (!pmProjectIndexesPromise) {
		pmProjectIndexesPromise = (async () => {
			const collection = await getPmProjectsCollection();
			await collection.createIndex({ workspaceId: 1, status: 1, updatedAt: -1 });
			await collection.createIndex({ workspaceId: 1, title: 1 });
		})();
	}

	await pmProjectIndexesPromise;
}

export async function countPmProjectsForWorkspace(workspaceId: string): Promise<number> {
	await ensurePmProjectIndexes();
	const collection = await getPmProjectsCollection();
	return collection.countDocuments({ workspaceId: new ObjectId(workspaceId) });
}

export async function countActivePmProjectsForWorkspace(workspaceId: string): Promise<number> {
	await ensurePmProjectIndexes();
	const collection = await getPmProjectsCollection();
	return collection.countDocuments({
		workspaceId: new ObjectId(workspaceId),
		status: { $in: [PM_PROJECT_STATUSES.PLANNING, PM_PROJECT_STATUSES.ACTIVE] }
	});
}

export async function listPmProjects(input: {
	workspaceId: string;
	page: number;
	limit: number;
	search?: string;
	status?: PmProjectDocument['status'];
}): Promise<{ items: PmProjectDto[]; total: number }> {
	await ensurePmProjectIndexes();

	const collection = await getPmProjectsCollection<PmProjectDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const filter: Record<string, unknown> = { workspaceId: workspaceObjectId };

	if (input.status) {
		filter.status = input.status;
	}

	if (input.search) {
		const pattern = new RegExp(input.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		filter.$or = [
			{ title: pattern },
			{ description: pattern },
			{ clientName: pattern },
			{ websiteUrl: pattern },
			{ notes: pattern }
		];
	}

	const skip = (input.page - 1) * input.limit;
	const [docs, total] = await Promise.all([
		collection
			.find(filter, { projection: PM_PROJECT_PROJECTION })
			.sort({ updatedAt: -1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	return {
		items: docs.map(toPmProjectDto),
		total
	};
}

export async function createPmProject(input: {
	workspaceId: string;
	data: CreatePmProjectInput;
}): Promise<PmProjectDto> {
	await ensurePmProjectIndexes();

	const now = new Date();
	const collection = await getPmProjectsCollection<PmProjectDocument>();
	const result = await collection.insertOne({
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		title: input.data.title,
		description: input.data.description ?? null,
		status: input.data.status ?? PM_PROJECT_STATUSES.PLANNING,
		clientName: input.data.clientName ?? null,
		websiteUrl: input.data.websiteUrl ?? null,
		crmCompanyId: input.data.crmCompanyId ? new ObjectId(input.data.crmCompanyId) : null,
		crmContactId: input.data.crmContactId ? new ObjectId(input.data.crmContactId) : null,
		dueDate: input.data.dueDate ? new Date(input.data.dueDate) : null,
		notes: input.data.notes ?? null,
		createdAt: now,
		updatedAt: now
	});

	const doc = await collection.findOne(
		{ _id: result.insertedId },
		{ projection: PM_PROJECT_PROJECTION }
	);

	if (!doc) {
		throw new Error('Failed to create project');
	}

	return toPmProjectDto(doc);
}

export async function getPmProjectForWorkspace(input: {
	workspaceId: string;
	projectId: string;
}): Promise<PmProjectDto | null> {
	await ensurePmProjectIndexes();

	const collection = await getPmProjectsCollection<PmProjectDocument>();
	const doc = await collection.findOne(
		{
			_id: new ObjectId(input.projectId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: PM_PROJECT_PROJECTION }
	);

	return doc ? toPmProjectDto(doc) : null;
}

export async function updatePmProjectForWorkspace(input: {
	workspaceId: string;
	projectId: string;
	data: UpdatePmProjectInput;
}): Promise<PmProjectDto | null> {
	await ensurePmProjectIndexes();

	const collection = await getPmProjectsCollection<PmProjectDocument>();
	const updates: Partial<PmProjectDocument> = {
		updatedAt: new Date()
	};

	if (input.data.title !== undefined) {
		updates.title = input.data.title;
	}

	if (input.data.description !== undefined) {
		updates.description = input.data.description;
	}

	if (input.data.status !== undefined) {
		updates.status = input.data.status;
	}

	if (input.data.clientName !== undefined) {
		updates.clientName = input.data.clientName;
	}

	if (input.data.websiteUrl !== undefined) {
		updates.websiteUrl = input.data.websiteUrl;
	}

	if (input.data.notes !== undefined) {
		updates.notes = input.data.notes;
	}

	if (input.data.dueDate !== undefined) {
		updates.dueDate =
			input.data.dueDate && input.data.dueDate.length > 0 ? new Date(input.data.dueDate) : null;
	}

	const result = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.projectId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ $set: updates },
		{ returnDocument: 'after', projection: PM_PROJECT_PROJECTION }
	);

	return result ? toPmProjectDto(result) : null;
}
