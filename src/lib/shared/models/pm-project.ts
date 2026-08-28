import type { ObjectId } from 'mongodb';
import type { PmProjectOnboarding, PmProjectOnboardingDocument } from '$lib/shared/models/pm-project-onboarding';
import type { PmProjectType } from '$lib/shared/project-management/project-types';

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
	projectTypes: PmProjectType[];
	projectUrl: string | null;
	/** @deprecated Use projectUrl — kept for legacy documents */
	websiteUrl?: string | null;
	crmCompanyId: ObjectId | null;
	crmContactId: ObjectId | null;
	dueDate: Date | null;
	notes: string | null;
	onboarding: PmProjectOnboardingDocument | null;
	isSeed?: boolean;
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
	projectTypes: PmProjectType[];
	projectUrl: string | null;
	crmCompanyId: string | null;
	crmContactId: string | null;
	dueDate: string | null;
	notes: string | null;
	onboarding: PmProjectOnboarding | null;
	createdAt: string;
	updatedAt: string;
};
