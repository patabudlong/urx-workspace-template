import type { WorkspaceMemberDocument } from '$lib/shared/models/workspace-member';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import { getWorkspaceMembersCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';

let workspaceMemberIndexesPromise: Promise<void> | null = null;

export async function ensureWorkspaceMemberIndexes(): Promise<void> {
	if (!workspaceMemberIndexesPromise) {
		workspaceMemberIndexesPromise = (async () => {
			const members = await getWorkspaceMembersCollection();

			try {
				await members.dropIndex('userId_1');
			} catch {
				// Legacy single-membership index may not exist.
			}

			await members.createIndex({ userId: 1, workspaceId: 1 }, { unique: true });
			await members.createIndex({ userId: 1 });
			await members.createIndex({ workspaceId: 1, role: 1 });
		})().catch((error) => {
			workspaceMemberIndexesPromise = null;
			throw error;
		});
	}

	return workspaceMemberIndexesPromise;
}

const memberProjection = {
	_id: 1,
	userId: 1,
	workspaceId: 1,
	role: 1,
	joinedAt: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

export async function findWorkspaceMemberByUserId(
	userId: string
): Promise<WorkspaceMemberDocument | null> {
	const members = await getWorkspaceMembersCollection<WorkspaceMemberDocument>();

	return members.findOne({ userId: new ObjectId(userId) }, { projection: memberProjection });
}

export async function listWorkspaceMembersByUserId(
	userId: string
): Promise<WorkspaceMemberDocument[]> {
	const members = await getWorkspaceMembersCollection<WorkspaceMemberDocument>();

	return members
		.find({ userId: new ObjectId(userId) }, { projection: memberProjection })
		.sort({ joinedAt: 1 })
		.toArray();
}

export async function findWorkspaceMemberByWorkspaceAndUserId(input: {
	workspaceId: string;
	userId: string;
}): Promise<WorkspaceMemberDocument | null> {
	const members = await getWorkspaceMembersCollection<WorkspaceMemberDocument>();

	return members.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			userId: new ObjectId(input.userId)
		},
		{ projection: memberProjection }
	);
}

export async function listWorkspaceMembersByWorkspaceId(
	workspaceId: string
): Promise<WorkspaceMemberDocument[]> {
	const members = await getWorkspaceMembersCollection<WorkspaceMemberDocument>();

	return members
		.find({ workspaceId: new ObjectId(workspaceId) }, { projection: memberProjection })
		.sort({ joinedAt: 1 })
		.toArray();
}

export async function createWorkspaceMember(input: {
	userId: string;
	workspaceId: string;
	role: WorkspaceMemberDocument['role'];
}): Promise<WorkspaceMemberDocument> {
	const members = await getWorkspaceMembersCollection<WorkspaceMemberDocument>();
	const now = new Date();

	const document: WorkspaceMemberDocument = {
		_id: new ObjectId(),
		userId: new ObjectId(input.userId),
		workspaceId: new ObjectId(input.workspaceId),
		role: input.role,
		joinedAt: now,
		createdAt: now,
		updatedAt: now
	};

	await members.insertOne(document);

	return document;
}

export async function findWorkspaceMemberById(input: {
	memberId: string;
	workspaceId: string;
}): Promise<WorkspaceMemberDocument | null> {
	const members = await getWorkspaceMembersCollection<WorkspaceMemberDocument>();

	return members.findOne(
		{
			_id: new ObjectId(input.memberId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: memberProjection }
	);
}

export async function removeWorkspaceMember(input: {
	memberId: string;
	workspaceId: string;
}): Promise<boolean> {
	const members = await getWorkspaceMembersCollection();

	const result = await members.deleteOne({
		_id: new ObjectId(input.memberId),
		workspaceId: new ObjectId(input.workspaceId),
		role: { $ne: WORKSPACE_MEMBER_ROLES.OWNER }
	});

	return result.deletedCount === 1;
}
