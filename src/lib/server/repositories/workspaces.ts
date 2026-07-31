import type { WorkspaceDocument } from '$lib/shared/models/workspace';
import { WORKSPACE_STATUSES } from '$lib/shared/models/workspace';
import { getWorkspacesCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';

let workspaceIndexesPromise: Promise<void> | null = null;

export async function ensureWorkspaceIndexes(): Promise<void> {
	if (!workspaceIndexesPromise) {
		workspaceIndexesPromise = (async () => {
			const workspaces = await getWorkspacesCollection();
			await workspaces.createIndex({ slug: 1 }, { unique: true });
			await workspaces.createIndex(
				{ name: 1 },
				{ unique: true, collation: { locale: 'en', strength: 2 } }
			);
			await workspaces.createIndex({ status: 1, createdAt: -1 });
			await workspaces.createIndex({ requestedByUserId: 1, status: 1 });
		})().catch((error) => {
			workspaceIndexesPromise = null;
			throw error;
		});
	}

	return workspaceIndexesPromise;
}

const workspaceProjection = {
	_id: 1,
	slug: 1,
	name: 1,
	contactPhone: 1,
	teamSize: 1,
	address: 1,
	website: 1,
	status: 1,
	requestedByUserId: 1,
	reviewedAt: 1,
	reviewedByUserId: 1,
	rejectionReason: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

export async function findWorkspaceById(workspaceId: string): Promise<WorkspaceDocument | null> {
	if (!ObjectId.isValid(workspaceId)) {
		return null;
	}

	const workspaces = await getWorkspacesCollection<WorkspaceDocument>();

	return workspaces.findOne({ _id: new ObjectId(workspaceId) }, { projection: workspaceProjection });
}

export async function findWorkspaceBySlug(slug: string): Promise<WorkspaceDocument | null> {
	const workspaces = await getWorkspacesCollection<WorkspaceDocument>();

	return workspaces.findOne({ slug: slug.trim().toLowerCase() }, { projection: workspaceProjection });
}

export async function findWorkspaceByName(name: string): Promise<WorkspaceDocument | null> {
	const trimmed = name.trim();

	if (!trimmed) {
		return null;
	}

	const workspaces = await getWorkspacesCollection<WorkspaceDocument>();

	return workspaces.findOne(
		{ name: trimmed },
		{
			projection: workspaceProjection,
			collation: { locale: 'en', strength: 2 }
		}
	);
}

export async function findWorkspaceBySlugOrId(ref: string): Promise<WorkspaceDocument | null> {
	const trimmed = ref.trim();

	if (ObjectId.isValid(trimmed) && trimmed.length === 24) {
		const byId = await findWorkspaceById(trimmed);
		if (byId) {
			return byId;
		}
	}

	return findWorkspaceBySlug(trimmed);
}

export async function findPendingWorkspaceByUserId(
	userId: string
): Promise<WorkspaceDocument | null> {
	const workspaces = await getWorkspacesCollection<WorkspaceDocument>();

	return workspaces.findOne(
		{
			requestedByUserId: new ObjectId(userId),
			status: WORKSPACE_STATUSES.PENDING_REVIEW
		},
		{ projection: workspaceProjection }
	);
}

export async function listPendingWorkspaces(limit = 50): Promise<WorkspaceDocument[]> {
	const workspaces = await getWorkspacesCollection<WorkspaceDocument>();

	return workspaces
		.find({ status: WORKSPACE_STATUSES.PENDING_REVIEW }, { projection: workspaceProjection })
		.sort({ createdAt: 1 })
		.limit(limit)
		.toArray();
}

export async function createWorkspaceRequest(input: {
	slug: string;
	name: string;
	contactPhone: string;
	teamSize: string;
	address: WorkspaceDocument['address'];
	website?: string;
	requestedByUserId: string;
}): Promise<WorkspaceDocument> {
	const workspaces = await getWorkspacesCollection<WorkspaceDocument>();
	const now = new Date();

	const document: WorkspaceDocument = {
		_id: new ObjectId(),
		slug: input.slug,
		name: input.name.trim(),
		contactPhone: input.contactPhone.trim(),
		teamSize: input.teamSize,
		address: input.address,
		website: input.website,
		status: WORKSPACE_STATUSES.PENDING_REVIEW,
		requestedByUserId: new ObjectId(input.requestedByUserId),
		createdAt: now,
		updatedAt: now
	};

	await workspaces.insertOne(document);

	return document;
}

export async function approveWorkspaceRequest(input: {
	workspaceId: string;
	reviewedByUserId: string;
}): Promise<WorkspaceDocument | null> {
	const workspaces = await getWorkspacesCollection<WorkspaceDocument>();
	const now = new Date();

	const result = await workspaces.findOneAndUpdate(
		{
			_id: new ObjectId(input.workspaceId),
			status: WORKSPACE_STATUSES.PENDING_REVIEW
		},
		{
			$set: {
				status: WORKSPACE_STATUSES.ACTIVE,
				reviewedAt: now,
				reviewedByUserId: new ObjectId(input.reviewedByUserId),
				updatedAt: now
			}
		},
		{ returnDocument: 'after', projection: workspaceProjection }
	);

	return result ?? null;
}

export async function rejectWorkspaceRequest(input: {
	workspaceId: string;
	reviewedByUserId: string;
	rejectionReason?: string;
}): Promise<WorkspaceDocument | null> {
	const workspaces = await getWorkspacesCollection<WorkspaceDocument>();
	const now = new Date();

	const result = await workspaces.findOneAndUpdate(
		{
			_id: new ObjectId(input.workspaceId),
			status: WORKSPACE_STATUSES.PENDING_REVIEW
		},
		{
			$set: {
				status: WORKSPACE_STATUSES.REJECTED,
				reviewedAt: now,
				reviewedByUserId: new ObjectId(input.reviewedByUserId),
				rejectionReason: input.rejectionReason?.trim() || undefined,
				updatedAt: now
			}
		},
		{ returnDocument: 'after', projection: workspaceProjection }
	);

	return result ?? null;
}
