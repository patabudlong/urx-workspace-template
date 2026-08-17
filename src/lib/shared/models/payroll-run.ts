import type { ObjectId } from 'mongodb';
import type { PayrollRunStatus } from '$lib/shared/payroll/schemas';

export type PayrollRunDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	title: string;
	periodStart: Date;
	periodEnd: Date;
	status: PayrollRunStatus;
	createdAt: Date;
	updatedAt: Date;
};

export type PayrollRunDto = {
	id: string;
	workspaceId: string;
	title: string;
	periodStart: string;
	periodEnd: string;
	status: PayrollRunStatus;
	createdAt: string;
	updatedAt: string;
};
