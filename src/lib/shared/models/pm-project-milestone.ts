import type { ObjectId } from 'mongodb';

export const PM_PROJECT_MILESTONE_STATUSES = {
	PENDING: 'pending',
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed'
} as const;

export type PmProjectMilestoneStatus =
	(typeof PM_PROJECT_MILESTONE_STATUSES)[keyof typeof PM_PROJECT_MILESTONE_STATUSES];

export type PmProjectMilestoneDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	projectId: ObjectId;
	title: string;
	description: string | null;
	status: PmProjectMilestoneStatus;
	dueDate: Date | null;
	sortOrder: number;
	completedAt: Date | null;
	isSeed?: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type PmProjectMilestoneDto = {
	id: string;
	projectId: string;
	title: string;
	description: string | null;
	status: PmProjectMilestoneStatus;
	dueDate: string | null;
	sortOrder: number;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
};
