import type { ObjectId } from 'mongodb';

export const WORKSPACE_SMS_MESSAGE_STATUSES = {
	PENDING: 'pending',
	SENT: 'sent',
	FAILED: 'failed'
} as const;

export type WorkspaceSmsMessageStatus =
	(typeof WORKSPACE_SMS_MESSAGE_STATUSES)[keyof typeof WORKSPACE_SMS_MESSAGE_STATUSES];

export type WorkspaceSmsMessageDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	sentByUserId: ObjectId;
	to: string;
	body: string;
	status: WorkspaceSmsMessageStatus;
	providerMessageId?: string;
	error?: string;
	createdAt: Date;
	updatedAt: Date;
};

export type WorkspaceSmsMessageDto = {
	id: string;
	workspaceId: string;
	sentByUserId: string;
	to: string;
	body: string;
	status: WorkspaceSmsMessageStatus;
	providerMessageId?: string;
	error?: string;
	createdAt: string;
	updatedAt: string;
};
