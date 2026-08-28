import type { ObjectId } from 'mongodb';

export const PM_CLIENT_INVITATION_STATUSES = {
	PENDING: 'pending',
	COMPLETED: 'completed',
	REVOKED: 'revoked',
	EXPIRED: 'expired'
} as const;

export type PmClientInvitationStatus =
	(typeof PM_CLIENT_INVITATION_STATUSES)[keyof typeof PM_CLIENT_INVITATION_STATUSES];

export type PmClientInvitationDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	projectId: ObjectId;
	clientEmail: string;
	clientName: string | null;
	tokenHash: string;
	invitedByUserId: ObjectId;
	status: PmClientInvitationStatus;
	expiresAt: Date;
	completedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
};

export type PmClientInvitationDto = {
	id: string;
	workspaceId: string;
	projectId: string;
	clientEmail: string;
	clientName: string | null;
	status: PmClientInvitationStatus;
	expiresAt: string;
	completedAt: string | null;
	createdAt: string;
};
