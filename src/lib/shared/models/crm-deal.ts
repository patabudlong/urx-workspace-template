import type { ObjectId } from 'mongodb';

export const CRM_DEAL_STAGES = {
	LEAD: 'lead',
	QUALIFIED: 'qualified',
	PROPOSAL: 'proposal',
	NEGOTIATION: 'negotiation',
	WON: 'won',
	LOST: 'lost'
} as const;

export type CrmDealStage = (typeof CRM_DEAL_STAGES)[keyof typeof CRM_DEAL_STAGES];

export type CrmDealDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	title: string;
	stage: CrmDealStage;
	value: number | null;
	currency: string;
	contactId: ObjectId | null;
	companyId: ObjectId | null;
	expectedCloseDate: Date | null;
	notes: string | null;
	isSeed?: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type CrmDealDto = {
	id: string;
	workspaceId: string;
	title: string;
	stage: CrmDealStage;
	value: number | null;
	currency: string;
	contactId: string | null;
	companyId: string | null;
	expectedCloseDate: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
};
