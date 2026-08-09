import type { ObjectId } from 'mongodb';

export const WORKSPACE_STATUSES = {
	PENDING_REVIEW: 'pending_review',
	ACTIVE: 'active',
	REJECTED: 'rejected'
} as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[keyof typeof WORKSPACE_STATUSES];

export type WorkspaceAddress = {
	line1: string;
	line2?: string;
	city: string;
	region?: string;
	postalCode?: string;
	country: string;
};

export type WorkspaceDocument = {
	_id: ObjectId;
	slug: string;
	name: string;
	contactPhone: string;
	teamSize: string;
	address: WorkspaceAddress;
	website?: string;
	brandLogoUrl?: string;
	status: WorkspaceStatus;
	requestedByUserId: ObjectId;
	reviewedAt?: Date;
	reviewedByUserId?: ObjectId;
	rejectionReason?: string;
	createdAt: Date;
	updatedAt: Date;
};

export type WorkspaceSummary = {
	id: string;
	slug: string;
	name: string;
	status: WorkspaceStatus;
};
