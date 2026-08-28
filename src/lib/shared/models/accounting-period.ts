import type { ObjectId } from 'mongodb';

export const ACCOUNTING_PERIOD_STATUSES = ['open', 'closed', 'locked'] as const;
export type AccountingPeriodStatus = (typeof ACCOUNTING_PERIOD_STATUSES)[number];

export type AccountingPeriodDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	year: number;
	month: number;
	label: string;
	status: AccountingPeriodStatus;
	startDate: string;
	endDate: string;
	createdAt: Date;
	updatedAt: Date;
};

export type AccountingPeriodDto = {
	id: string;
	workspaceId: string;
	year: number;
	month: number;
	label: string;
	status: AccountingPeriodStatus;
	startDate: string;
	endDate: string;
};
