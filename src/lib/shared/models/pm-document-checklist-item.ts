import type { ObjectId } from 'mongodb';

export const PM_DOCUMENT_CHECKLIST_STATUSES = {
	PENDING: 'pending',
	SUBMITTED: 'submitted',
	APPROVED: 'approved',
	REJECTED: 'rejected'
} as const;

export type PmDocumentChecklistStatus =
	(typeof PM_DOCUMENT_CHECKLIST_STATUSES)[keyof typeof PM_DOCUMENT_CHECKLIST_STATUSES];

export type PmDocumentChecklistItemDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	projectId: ObjectId;
	title: string;
	description: string | null;
	required: boolean;
	dueDate: Date | null;
	sortOrder: number;
	status: PmDocumentChecklistStatus;
	submittedAt: Date | null;
	reviewedAt: Date | null;
	reviewedByUserId: ObjectId | null;
	isSeed?: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type PmDocumentChecklistItemDto = {
	id: string;
	workspaceId: string;
	projectId: string;
	title: string;
	description: string | null;
	required: boolean;
	dueDate: string | null;
	sortOrder: number;
	status: PmDocumentChecklistStatus;
	submittedAt: string | null;
	reviewedAt: string | null;
	fileCount: number;
	createdAt: string;
	updatedAt: string;
};
