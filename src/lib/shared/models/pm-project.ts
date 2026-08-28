import type { ObjectId } from 'mongodb';

export const PM_PROJECT_STATUSES = {
	PLANNING: 'planning',
	ACTIVE: 'active',
	ON_HOLD: 'on_hold',
	COMPLETED: 'completed',
	CANCELLED: 'cancelled'
} as const;

export type PmProjectStatus = (typeof PM_PROJECT_STATUSES)[keyof typeof PM_PROJECT_STATUSES];

export type PmProjectDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	title: string;
	description: string | null;
	status: PmProjectStatus;
	clientName: string | null;
	websiteUrl: string | null;
	crmCompanyId: ObjectId | null;
	crmContactId: ObjectId | null;
	dueDate: Date | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type PmProjectDto = {
	id: string;
	workspaceId: string;
	title: string;
	description: string | null;
	status: PmProjectStatus;
	clientName: string | null;
	websiteUrl: string | null;
	crmCompanyId: string | null;
	crmContactId: string | null;
	dueDate: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
};
