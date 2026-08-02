import { getWorkspaceInvitationsCollection } from '$lib/server/db/collections';
import type { WorkspaceInvitationDocument } from '$lib/shared/models/workspace-invitation';
import { WORKSPACE_INVITATION_STATUSES } from '$lib/shared/models/workspace-invitation';
import type { TeamInviteRole } from '$lib/shared/team/invite-roles';
import { ObjectId } from 'mongodb';

let workspaceInvitationIndexesPromise: Promise<void> | null = null;

const TERMINAL_INVITATION_STATUSES = [
	WORKSPACE_INVITATION_STATUSES.ACCEPTED,
	WORKSPACE_INVITATION_STATUSES.REVOKED,
	WORKSPACE_INVITATION_STATUSES.EXPIRED
] as const;

function openInvitationFilter(now = new Date()) {
	return {
		status: { $nin: TERMINAL_INVITATION_STATUSES },
		expiresAt: { $gt: now }
	};
}

const invitationProjection = {
	_id: 1,
	workspaceId: 1,
	invitedEmail: 1,
	role: 1,
	tokenHash: 1,
	invitedByUserId: 1,
	status: 1,
	expiresAt: 1,
	acceptedAt: 1,
	revokedAt: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

export async function ensureWorkspaceInvitationIndexes(): Promise<void> {
	if (!workspaceInvitationIndexesPromise) {
		workspaceInvitationIndexesPromise = (async () => {
			const invitations = await getWorkspaceInvitationsCollection();

			await invitations.createIndex({ tokenHash: 1 }, { unique: true });
			await invitations.createIndex({ workspaceId: 1, createdAt: -1 });
			await invitations.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
			await invitations.createIndex(
				{ workspaceId: 1, invitedEmail: 1 },
				{
					unique: true,
					partialFilterExpression: { status: WORKSPACE_INVITATION_STATUSES.PENDING }
				}
			);

			const now = new Date();

			await invitations.updateMany(
				{
					status: { $nin: [...TERMINAL_INVITATION_STATUSES, WORKSPACE_INVITATION_STATUSES.PENDING] },
					expiresAt: { $gt: now }
				},
				{
					$set: {
						status: WORKSPACE_INVITATION_STATUSES.PENDING,
						updatedAt: now
					}
				}
			);
		})().catch((error) => {
			workspaceInvitationIndexesPromise = null;
			throw error;
		});
	}

	return workspaceInvitationIndexesPromise;
}

export async function findPendingWorkspaceInvitation(input: {
	workspaceId: string;
	invitedEmail: string;
}): Promise<WorkspaceInvitationDocument | null> {
	const invitations = await getWorkspaceInvitationsCollection<WorkspaceInvitationDocument>();
	const now = new Date();

	return invitations.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			invitedEmail: input.invitedEmail.trim().toLowerCase(),
			...openInvitationFilter(now)
		},
		{ projection: invitationProjection }
	);
}

export async function listPendingWorkspaceInvitations(
	workspaceId: string
): Promise<WorkspaceInvitationDocument[]> {
	const invitations = await getWorkspaceInvitationsCollection<WorkspaceInvitationDocument>();
	const now = new Date();

	return invitations
		.find(
			{
				workspaceId: new ObjectId(workspaceId),
				...openInvitationFilter(now)
			},
			{ projection: invitationProjection }
		)
		.sort({ createdAt: -1 })
		.toArray();
}

export async function findValidWorkspaceInvitationByTokenHash(
	tokenHash: string
): Promise<WorkspaceInvitationDocument | null> {
	const invitations = await getWorkspaceInvitationsCollection<WorkspaceInvitationDocument>();
	const now = new Date();

	return invitations.findOne(
		{
			tokenHash,
			...openInvitationFilter(now)
		},
		{ projection: invitationProjection }
	);
}

export async function markWorkspaceInvitationAccepted(invitationId: string): Promise<void> {
	const invitations = await getWorkspaceInvitationsCollection();
	const now = new Date();

	await invitations.updateOne(
		{ _id: new ObjectId(invitationId) },
		{
			$set: {
				status: WORKSPACE_INVITATION_STATUSES.ACCEPTED,
				acceptedAt: now,
				updatedAt: now
			}
		}
	);
}

export async function createWorkspaceInvitation(input: {
	workspaceId: string;
	invitedEmail: string;
	role: TeamInviteRole;
	tokenHash: string;
	invitedByUserId: string;
	expiresAt: Date;
}): Promise<WorkspaceInvitationDocument> {
	const invitations = await getWorkspaceInvitationsCollection<WorkspaceInvitationDocument>();
	const now = new Date();
	const invitedEmail = input.invitedEmail.trim().toLowerCase();

	const document: WorkspaceInvitationDocument = {
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		invitedEmail,
		role: input.role,
		tokenHash: input.tokenHash,
		invitedByUserId: new ObjectId(input.invitedByUserId),
		status: WORKSPACE_INVITATION_STATUSES.PENDING,
		expiresAt: input.expiresAt,
		createdAt: now,
		updatedAt: now
	};

	await invitations.insertOne(document);

	return document;
}
