import type { ObjectId } from 'mongodb';

export const PM_PROJECT_FILE_UPLOADED_BY = {
	CLIENT: 'client',
	STAFF: 'staff'
} as const;

export type PmProjectFileUploadedBy =
	(typeof PM_PROJECT_FILE_UPLOADED_BY)[keyof typeof PM_PROJECT_FILE_UPLOADED_BY];

export type PmProjectFileDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	projectId: ObjectId;
	checklistItemId: ObjectId;
	storageKey: string;
	originalFilename: string;
	contentType: string;
	sizeBytes: number;
	uploadedBy: PmProjectFileUploadedBy;
	uploadedByEmail: string | null;
	uploadedByUserId: ObjectId | null;
	invitationId: ObjectId | null;
	isSeed?: boolean;
	createdAt: Date;
};

export type PmProjectFileDto = {
	id: string;
	checklistItemId: string;
	originalFilename: string;
	contentType: string;
	sizeBytes: number;
	uploadedBy: PmProjectFileUploadedBy;
	uploadedByEmail: string | null;
	createdAt: string;
};
