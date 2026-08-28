import type { ObjectId } from 'mongodb';

export const PM_PROJECT_ACTIVITY_TYPES = {
	CREATED: 'created',
	STATUS_CHANGED: 'status_changed',
	COMMENT: 'comment',
	MILESTONE_COMPLETED: 'milestone_completed',
	ASSIGNEE_CHANGED: 'assignee_changed'
} as const;

export type PmProjectActivityType =
	(typeof PM_PROJECT_ACTIVITY_TYPES)[keyof typeof PM_PROJECT_ACTIVITY_TYPES];

export type PmProjectActivityDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	projectId: ObjectId;
	type: PmProjectActivityType;
	body: string;
	actorUserId: ObjectId | null;
	metadata: Record<string, string> | null;
	isSeed?: boolean;
	createdAt: Date;
};

export type PmProjectActivityDto = {
	id: string;
	projectId: string;
	type: PmProjectActivityType;
	body: string;
	actorUserId: string | null;
	actorName: string | null;
	metadata: Record<string, string> | null;
	createdAt: string;
};
