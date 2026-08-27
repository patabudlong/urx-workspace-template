import type { ObjectId } from 'mongodb';
import type { AccountingJournalSource } from '$lib/shared/accounting/journal-sources';

export type AccountingJournalLineDocument = {
	accountId: ObjectId;
	accountCode: string;
	accountName: string;
	description?: string | null;
	debitCents: number;
	creditCents: number;
};

export type AccountingJournalEntryDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	periodId: ObjectId;
	entryDate: string;
	reference?: string | null;
	memo?: string | null;
	source: AccountingJournalSource;
	status: 'posted';
	lines: AccountingJournalLineDocument[];
	createdByUserId: ObjectId;
	createdAt: Date;
	updatedAt: Date;
};

export type AccountingJournalLineDto = {
	accountId: string;
	accountCode: string;
	accountName: string;
	description: string | null;
	debitCents: number;
	creditCents: number;
};

export type AccountingJournalEntryDto = {
	id: string;
	workspaceId: string;
	periodId: string;
	entryDate: string;
	reference: string | null;
	memo: string | null;
	source: AccountingJournalSource;
	status: 'posted';
	lines: AccountingJournalLineDto[];
	createdByUserId: string;
	createdAt: string;
};

export type TrialBalanceRowDto = {
	accountId: string;
	accountCode: string;
	accountName: string;
	accountType: string;
	debitCents: number;
	creditCents: number;
	balanceCents: number;
};

export type TrialBalanceDto = {
	periodId: string;
	periodLabel: string;
	rows: TrialBalanceRowDto[];
	totalDebitCents: number;
	totalCreditCents: number;
};
