import { getWorkspaceInvitationsCollection } from '$lib/server/db/collections';
import type { WorkspaceInvitationDocument } from '$lib/shared/models/workspace-invitation';
import { WORKSPACE_INVITATION_STATUSES } from '$lib/shared/models/workspace-invitation';
import type { TeamInviteRole } from '$lib/shared/team/invite-roles';
import { ObjectId } from 'mongodb';

let workspaceInvitationIndexesPromise: Promise<void> | null = null;

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
			status: WORKSPACE_INVITATION_STATUSES.PENDING,
			expiresAt: { $gt: now }
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
				status: WORKSPACE_INVITATION_STATUSES.PENDING,
				expiresAt: { $gt: now }
			},
			{ projection: invitationProjection }
		)
		.sort({ createdAt: -1 })
		.toArray();
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
