import { getPmProjectActivityCollection } from '$lib/server/db/collections';
import { findUsersByIds } from '$lib/server/repositories/users';
import type {
	PmProjectActivityDocument,
	PmProjectActivityDto,
	PmProjectActivityType
} from '$lib/shared/models/pm-project-activity';
import { ObjectId } from 'mongodb';

let pmProjectActivityIndexesPromise: Promise<void> | null = null;

const activityProjection = {
	_id: 1,
	workspaceId: 1,
	projectId: 1,
	type: 1,
	body: 1,
	actorUserId: 1,
	metadata: 1,
	createdAt: 1
} as const;

async function ensurePmProjectActivityIndexes(): Promise<void> {
	if (!pmProjectActivityIndexesPromise) {
		pmProjectActivityIndexesPromise = (async () => {
			const collection = await getPmProjectActivityCollection();
			await collection.createIndex({ workspaceId: 1, projectId: 1, createdAt: -1 });
		})();
	}

	await pmProjectActivityIndexesPromise;
}

export async function logPmProjectActivity(input: {
	workspaceId: string;
	projectId: string;
	type: PmProjectActivityType;
	body: string;
	actorUserId: string | null;
	metadata?: Record<string, string> | null;
}): Promise<void> {
	await ensurePmProjectActivityIndexes();

	const collection = await getPmProjectActivityCollection<PmProjectActivityDocument>();
	const now = new Date();

	await collection.insertOne({
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId),
		type: input.type,
		body: input.body,
		actorUserId: input.actorUserId ? new ObjectId(input.actorUserId) : null,
		metadata: input.metadata ?? null,
		createdAt: now
	});
}

export async function listPmProjectActivityForProject(input: {
	workspaceId: string;
	projectId: string;
	limit?: number;
}): Promise<PmProjectActivityDto[]> {
	await ensurePmProjectActivityIndexes();

	const collection = await getPmProjectActivityCollection<PmProjectActivityDocument>();
	const docs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				projectId: new ObjectId(input.projectId)
			},
			{ projection: activityProjection }
		)
		.sort({ createdAt: -1 })
		.limit(input.limit ?? 50)
		.toArray();

	const actorIds = [
		...new Set(
			docs
				.map((doc) => doc.actorUserId?.toString())
				.filter((id): id is string => Boolean(id))
		)
	];
	const users = await findUsersByIds(actorIds);
	const usersById = new Map(users.map((user) => [user._id.toString(), user]));

	return docs.map((doc) => {
		const actor = doc.actorUserId ? usersById.get(doc.actorUserId.toString()) : null;
		const actorName = actor
			? `${actor.firstName ?? ''} ${actor.lastName ?? ''}`.trim() || actor.email
			: null;

		return {
			id: doc._id.toString(),
			projectId: doc.projectId.toString(),
			type: doc.type,
			body: doc.body,
			actorUserId: doc.actorUserId?.toString() ?? null,
			actorName,
			metadata: doc.metadata,
			createdAt: doc.createdAt.toISOString()
		};
	});
}

export async function deletePmProjectActivityForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<number> {
	await ensurePmProjectActivityIndexes();

	const collection = await getPmProjectActivityCollection();
	const result = await collection.deleteMany({
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId)
	});

	return result.deletedCount;
}
