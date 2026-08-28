import { getPmProjectMilestonesCollection } from '$lib/server/db/collections';
import type {
	PmProjectMilestoneDocument,
	PmProjectMilestoneDto,
	PmProjectMilestoneStatus
} from '$lib/shared/models/pm-project-milestone';
import { PM_PROJECT_MILESTONE_STATUSES } from '$lib/shared/models/pm-project-milestone';
import { ObjectId } from 'mongodb';

let pmProjectMilestoneIndexesPromise: Promise<void> | null = null;

const milestoneProjection = {
	_id: 1,
	workspaceId: 1,
	projectId: 1,
	title: 1,
	description: 1,
	status: 1,
	dueDate: 1,
	sortOrder: 1,
	completedAt: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toPmProjectMilestoneDto(doc: PmProjectMilestoneDocument): PmProjectMilestoneDto {
	return {
		id: doc._id.toString(),
		projectId: doc.projectId.toString(),
		title: doc.title,
		description: doc.description,
		status: doc.status,
		dueDate: doc.dueDate?.toISOString() ?? null,
		sortOrder: doc.sortOrder,
		completedAt: doc.completedAt?.toISOString() ?? null,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

export async function ensurePmProjectMilestoneIndexes(): Promise<void> {
	if (!pmProjectMilestoneIndexesPromise) {
		pmProjectMilestoneIndexesPromise = (async () => {
			const collection = await getPmProjectMilestonesCollection();
			await collection.createIndex({ workspaceId: 1, projectId: 1, sortOrder: 1 });
		})();
	}

	await pmProjectMilestoneIndexesPromise;
}

export async function listPmProjectMilestonesForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<PmProjectMilestoneDto[]> {
	await ensurePmProjectMilestoneIndexes();

	const collection = await getPmProjectMilestonesCollection<PmProjectMilestoneDocument>();
	const docs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				projectId: new ObjectId(input.projectId)
			},
			{ projection: milestoneProjection }
		)
		.sort({ sortOrder: 1, createdAt: 1 })
		.toArray();

	return docs.map(toPmProjectMilestoneDto);
}

export async function createPmProjectMilestone(input: {
	workspaceId: string;
	projectId: string;
	title: string;
	description: string | null;
}): Promise<PmProjectMilestoneDto> {
	await ensurePmProjectMilestoneIndexes();

	const now = new Date();
	const collection = await getPmProjectMilestonesCollection<PmProjectMilestoneDocument>();
	const last = await collection.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			projectId: new ObjectId(input.projectId)
		},
		{ projection: { sortOrder: 1 }, sort: { sortOrder: -1 } }
	);

	const doc: PmProjectMilestoneDocument = {
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId),
		title: input.title.trim(),
		description: input.description,
		status: PM_PROJECT_MILESTONE_STATUSES.PENDING,
		dueDate: null,
		sortOrder: (last?.sortOrder ?? -1) + 1,
		completedAt: null,
		createdAt: now,
		updatedAt: now
	};

	await collection.insertOne(doc);
	return toPmProjectMilestoneDto(doc);
}

export async function updatePmProjectMilestoneStatus(input: {
	workspaceId: string;
	projectId: string;
	milestoneId: string;
	status: PmProjectMilestoneStatus;
}): Promise<PmProjectMilestoneDto | null> {
	await ensurePmProjectMilestoneIndexes();

	const now = new Date();
	const collection = await getPmProjectMilestonesCollection<PmProjectMilestoneDocument>();

	const result = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.milestoneId),
			workspaceId: new ObjectId(input.workspaceId),
			projectId: new ObjectId(input.projectId)
		},
		{
			$set: {
				status: input.status,
				completedAt:
					input.status === PM_PROJECT_MILESTONE_STATUSES.COMPLETED ? now : null,
				updatedAt: now
			}
		},
		{ returnDocument: 'after', projection: milestoneProjection }
	);

	return result ? toPmProjectMilestoneDto(result) : null;
}

export async function deletePmProjectMilestone(input: {
	workspaceId: string;
	projectId: string;
	milestoneId: string;
}): Promise<boolean> {
	await ensurePmProjectMilestoneIndexes();

	const collection = await getPmProjectMilestonesCollection();
	const result = await collection.deleteOne({
		_id: new ObjectId(input.milestoneId),
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId)
	});

	return result.deletedCount === 1;
}

export async function deletePmProjectMilestonesForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<number> {
	await ensurePmProjectMilestoneIndexes();

	const collection = await getPmProjectMilestonesCollection();
	const result = await collection.deleteMany({
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId)
	});

	return result.deletedCount;
}
