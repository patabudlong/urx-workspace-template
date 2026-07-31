import type { ObjectId } from 'mongodb';

export const WORKSPACE_MEMBER_ROLES = {
	OWNER: 'owner',
	MEMBER: 'member'
} as const;

export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[keyof typeof WORKSPACE_MEMBER_ROLES];

export type WorkspaceMemberDocument = {
	_id: ObjectId;
	userId: ObjectId;
	workspaceId: ObjectId;
	role: WorkspaceMemberRole;
	joinedAt: Date;
	createdAt: Date;
	updatedAt: Date;
};
