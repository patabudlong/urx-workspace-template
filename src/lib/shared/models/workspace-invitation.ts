import type { ObjectId } from 'mongodb';
import type { TeamInviteRole } from '$lib/shared/team/invite-roles';

export const WORKSPACE_INVITATION_STATUSES = {
	PENDING: 'pending',
	ACCEPTED: 'accepted',
	REVOKED: 'revoked',
	EXPIRED: 'expired'
} as const;

export type WorkspaceInvitationStatus =
	(typeof WORKSPACE_INVITATION_STATUSES)[keyof typeof WORKSPACE_INVITATION_STATUSES];

export type WorkspaceInvitationDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	invitedEmail: string;
	role: TeamInviteRole;
	tokenHash: string;
	invitedByUserId: ObjectId;
	status: WorkspaceInvitationStatus;
	expiresAt: Date;
	acceptedAt?: Date;
	revokedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
};
