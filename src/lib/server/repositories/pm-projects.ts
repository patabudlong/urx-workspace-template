import type { PmProjectDocument, PmProjectDto } from '$lib/shared/models/pm-project';
import type { PmProjectOnboarding } from '$lib/shared/models/pm-project-onboarding';
import { PM_PROJECT_STATUSES } from '$lib/shared/models/pm-project';
import { getPmProjectsCollection } from '$lib/server/db/collections';
import { normalizePmProjectTypes } from '$lib/shared/project-management/project-types';
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
	projectTypes: 1,
	projectUrl: 1,
	websiteUrl: 1,
	crmCompanyId: 1,
	crmContactId: 1,
	crmDealId: 1,
	assignedMemberId: 1,
	dueDate: 1,
	notes: 1,
	onboarding: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function mapOnboarding(
	onboarding: NonNullable<PmProjectDocument['onboarding']>
): PmProjectOnboarding {
	return {
		contactName: onboarding.contactName,
		contactEmail: onboarding.contactEmail,
		businessName: onboarding.businessName,
		projectGoals: onboarding.projectGoals ?? onboarding.websiteGoals ?? '',
		pagesNeeded: onboarding.pagesNeeded,
		brandNotes: onboarding.brandNotes,
		domainStatus: onboarding.domainStatus,
		hostingPreference: onboarding.hostingPreference,
		additionalNotes: onboarding.additionalNotes,
		submittedAt: onboarding.submittedAt.toISOString()
	};
}

function toPmProjectDto(doc: PmProjectDocument): PmProjectDto {
	const legacyUrl = doc.projectUrl ?? doc.websiteUrl ?? null;

	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		title: doc.title,
		description: doc.description,
		status: doc.status,
		clientName: doc.clientName,
		projectTypes: normalizePmProjectTypes(doc.projectTypes, legacyUrl),
		projectUrl: legacyUrl,
		crmCompanyId: doc.crmCompanyId?.toString() ?? null,
		crmContactId: doc.crmContactId?.toString() ?? null,
		crmDealId: doc.crmDealId?.toString() ?? null,
		assignedMemberId: doc.assignedMemberId?.toString() ?? null,
		dueDate: doc.dueDate?.toISOString() ?? null,
		notes: doc.notes,
		onboarding: doc.onboarding ? mapOnboarding(doc.onboarding) : null,
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
			await collection.createIndex({ workspaceId: 1, crmDealId: 1 }, { sparse: true });
			await collection.createIndex({ workspaceId: 1, assignedMemberId: 1 }, { sparse: true });
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
			{ projectUrl: pattern },
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
		projectTypes: input.data.projectTypes,
		projectUrl: input.data.projectUrl ?? null,
		crmCompanyId: input.data.crmCompanyId ? new ObjectId(input.data.crmCompanyId) : null,
		crmContactId: input.data.crmContactId ? new ObjectId(input.data.crmContactId) : null,
		crmDealId: input.data.crmDealId ? new ObjectId(input.data.crmDealId) : null,
		assignedMemberId: input.data.assignedMemberId
			? new ObjectId(input.data.assignedMemberId)
			: null,
		dueDate: input.data.dueDate ? new Date(input.data.dueDate) : null,
		notes: input.data.notes ?? null,
		onboarding: null,
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

	if (input.data.projectTypes !== undefined) {
		updates.projectTypes = input.data.projectTypes;
	}

	if (input.data.projectUrl !== undefined) {
		updates.projectUrl = input.data.projectUrl;
	}

	if (input.data.assignedMemberId !== undefined) {
		updates.assignedMemberId = input.data.assignedMemberId
			? new ObjectId(input.data.assignedMemberId)
			: null;
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

export async function savePmProjectOnboarding(input: {
	workspaceId: string;
	projectId: string;
	onboarding: PmProjectOnboarding;
	clientName?: string | null;
}): Promise<PmProjectDto | null> {
	await ensurePmProjectIndexes();

	const collection = await getPmProjectsCollection<PmProjectDocument>();
	const now = new Date();
	const onboardingDocument = {
		...input.onboarding,
		submittedAt: new Date(input.onboarding.submittedAt)
	};

	const updates: Partial<PmProjectDocument> = {
		onboarding: onboardingDocument,
		updatedAt: now
	};

	if (input.clientName) {
		updates.clientName = input.clientName;
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

export async function deletePmProjectForWorkspace(input: {
	workspaceId: string;
	projectId: string;
}): Promise<boolean> {
	await ensurePmProjectIndexes();

	const collection = await getPmProjectsCollection();
	const result = await collection.deleteOne({
		_id: new ObjectId(input.projectId),
		workspaceId: new ObjectId(input.workspaceId)
	});

	return result.deletedCount === 1;
}

export async function findPmProjectByCrmDealId(input: {
	workspaceId: string;
	crmDealId: string;
}): Promise<PmProjectDto | null> {
	await ensurePmProjectIndexes();

	const collection = await getPmProjectsCollection<PmProjectDocument>();
	const doc = await collection.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			crmDealId: new ObjectId(input.crmDealId)
		},
		{ projection: PM_PROJECT_PROJECTION }
	);

	return doc ? toPmProjectDto(doc) : null;
}

export { logPmProjectActivity, listPmProjectActivityForProject } from '$lib/server/repositories/pm-project-activity';
