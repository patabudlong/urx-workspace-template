import type { ObjectId } from 'mongodb';
import type { AccountingJurisdiction } from '$lib/shared/accounting/schemas';

export type AccountingSettingsDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	companyName: string;
	tin?: string | null;
	addressLine1?: string | null;
	addressLine2?: string | null;
	city?: string | null;
	province?: string | null;
	fiscalYearStartMonth: number;
	timezone: string;
	baseCurrency: 'PHP';
	jurisdiction: AccountingJurisdiction;
	configured: boolean;
	seededAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type AccountingSettingsDto = {
	workspaceId: string;
	companyName: string;
	tin: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	province: string | null;
	fiscalYearStartMonth: number;
	timezone: string;
	baseCurrency: 'PHP';
	jurisdiction: AccountingJurisdiction;
	configured: boolean;
	updatedAt: string | null;
};
