import type {
	AccountingJournalEntryDocument,
	AccountingJournalEntryDto
} from '$lib/shared/models/accounting-journal-entry';
import { getAccountingJournalEntriesCollection } from '$lib/server/db/collections';
import { getAccountingAccountsByIds } from '$lib/server/repositories/accounting-accounts';
import {
	getAccountingPeriodForWorkspace,
	getFirstFiscalPeriodForWorkspace
} from '$lib/server/repositories/accounting-periods';
import { isDateWithinPeriod } from '$lib/server/accounting/periods';
import type { PostJournalEntryInput } from '$lib/shared/accounting/core/journal-validation';
import {
	type AccountingJournalSource
} from '$lib/shared/accounting/journal-sources';
import { ObjectId } from 'mongodb';

let accountingJournalIndexesPromise: Promise<void> | null = null;

const JOURNAL_PROJECTION = {
	_id: 1,
	workspaceId: 1,
	periodId: 1,
	entryDate: 1,
	reference: 1,
	memo: 1,
	source: 1,
	status: 1,
	lines: 1,
	createdByUserId: 1,
	createdAt: 1
} as const;

function toJournalDto(doc: AccountingJournalEntryDocument): AccountingJournalEntryDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		periodId: doc.periodId.toString(),
		entryDate: doc.entryDate,
		reference: doc.reference ?? null,
		memo: doc.memo ?? null,
		source: doc.source,
		status: doc.status,
		lines: doc.lines.map((line) => ({
			accountId: line.accountId.toString(),
			accountCode: line.accountCode,
			accountName: line.accountName,
			description: line.description ?? null,
			debitCents: line.debitCents,
			creditCents: line.creditCents
		})),
		createdByUserId: doc.createdByUserId.toString(),
		createdAt: doc.createdAt.toISOString()
	};
}

async function ensureAccountingJournalIndexes(): Promise<void> {
	if (!accountingJournalIndexesPromise) {
		accountingJournalIndexesPromise = (async () => {
			const collection = await getAccountingJournalEntriesCollection();
			await collection.createIndex({ workspaceId: 1, periodId: 1, entryDate: -1 });
			await collection.createIndex({ workspaceId: 1, createdAt: -1 });
			await collection.createIndex({ workspaceId: 1, source: 1, periodId: 1 });
			await collection.createIndex({ workspaceId: 1, source: 1, reference: 1 });
		})();
	}

	await accountingJournalIndexesPromise;
}

export async function listAccountingJournalEntriesForWorkspace(input: {
	workspaceId: string;
	periodId?: string;
	source?: AccountingJournalSource;
	limit?: number;
}): Promise<AccountingJournalEntryDto[]> {
	await ensureAccountingJournalIndexes();
	const collection = await getAccountingJournalEntriesCollection<AccountingJournalEntryDocument>();
	const filter: Record<string, unknown> = { workspaceId: new ObjectId(input.workspaceId) };

	if (input.periodId) {
		filter.periodId = new ObjectId(input.periodId);
	}

	if (input.source) {
		filter.source = input.source;
	}

	const docs = await collection
		.find(filter, { projection: JOURNAL_PROJECTION })
		.sort({ entryDate: -1, createdAt: -1 })
		.limit(input.limit ?? 100)
		.toArray();

	return docs.map(toJournalDto);
}

export async function getAccountingJournalEntryForWorkspace(input: {
	workspaceId: string;
	entryId: string;
}): Promise<AccountingJournalEntryDto | null> {
	await ensureAccountingJournalIndexes();
	const collection = await getAccountingJournalEntriesCollection<AccountingJournalEntryDocument>();
	const doc = await collection.findOne(
		{
			_id: new ObjectId(input.entryId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: JOURNAL_PROJECTION }
	);

	return doc ? toJournalDto(doc) : null;
}

export async function countAccountingJournalEntriesForWorkspace(
	workspaceId: string,
	source?: AccountingJournalSource
): Promise<number> {
	await ensureAccountingJournalIndexes();
	const collection = await getAccountingJournalEntriesCollection();
	const filter: Record<string, unknown> = { workspaceId: new ObjectId(workspaceId) };

	if (source) {
		filter.source = source;
	}

	return collection.countDocuments(filter);
}

export async function hasOpeningBalanceForPeriod(input: {
	workspaceId: string;
	periodId: string;
}): Promise<boolean> {
	await ensureAccountingJournalIndexes();
	const collection = await getAccountingJournalEntriesCollection();
	const count = await collection.countDocuments({
		workspaceId: new ObjectId(input.workspaceId),
		periodId: new ObjectId(input.periodId),
		source: 'opening_balance'
	});

	return count > 0;
}

export async function hasManualJournalsForPeriod(input: {
	workspaceId: string;
	periodId: string;
}): Promise<boolean> {
	await ensureAccountingJournalIndexes();
	const collection = await getAccountingJournalEntriesCollection();
	const count = await collection.countDocuments({
		workspaceId: new ObjectId(input.workspaceId),
		periodId: new ObjectId(input.periodId),
		source: 'manual'
	});

	return count > 0;
}

export async function countJournalEntriesForPeriod(input: {
	workspaceId: string;
	periodId: string;
}): Promise<number> {
	await ensureAccountingJournalIndexes();
	const collection = await getAccountingJournalEntriesCollection();

	return collection.countDocuments({
		workspaceId: new ObjectId(input.workspaceId),
		periodId: new ObjectId(input.periodId)
	});
}

export async function countJournalEntriesByPeriodForWorkspace(
	workspaceId: string
): Promise<Record<string, number>> {
	await ensureAccountingJournalIndexes();
	const collection = await getAccountingJournalEntriesCollection();
	const rows = await collection
		.aggregate<{ _id: ObjectId; count: number }>([
			{ $match: { workspaceId: new ObjectId(workspaceId) } },
			{ $group: { _id: '$periodId', count: { $sum: 1 } } }
		])
		.toArray();

	return Object.fromEntries(rows.map((row) => [row._id.toString(), row.count]));
}

async function validateOpeningBalanceEntry(input: {
	workspaceId: string;
	periodId: string;
}): Promise<void> {
	const firstPeriod = await getFirstFiscalPeriodForWorkspace(input.workspaceId);

	if (!firstPeriod || firstPeriod.id !== input.periodId) {
		throw new Error('Opening balances must be posted to the first fiscal period');
	}

	if (await hasOpeningBalanceForPeriod(input)) {
		throw new Error('An opening balance entry already exists for this period');
	}

	if (await hasManualJournalsForPeriod(input)) {
		throw new Error('Opening balances must be posted before other journal entries in this period');
	}
}

export async function hasAccountingJournalForReference(input: {
	workspaceId: string;
	source: AccountingJournalSource;
	reference: string;
}): Promise<boolean> {
	await ensureAccountingJournalIndexes();
	const collection = await getAccountingJournalEntriesCollection();
	const count = await collection.countDocuments({
		workspaceId: new ObjectId(input.workspaceId),
		source: input.source,
		reference: input.reference
	});

	return count > 0;
}

export async function createAccountingJournalEntryForWorkspace(input: {
	workspaceId: string;
	userId: string;
	data: PostJournalEntryInput;
}): Promise<AccountingJournalEntryDto> {
	await ensureAccountingJournalIndexes();

	const period = await getAccountingPeriodForWorkspace({
		workspaceId: input.workspaceId,
		periodId: input.data.periodId
	});

	if (!period) {
		throw new Error('Fiscal period not found');
	}

	if (period.status !== 'open') {
		throw new Error('Fiscal period is not open');
	}

	if (!isDateWithinPeriod(input.data.entryDate, period)) {
		throw new Error('Entry date must fall within the selected fiscal period');
	}

	const source = input.data.source ?? 'manual';

	if (source === 'opening_balance') {
		await validateOpeningBalanceEntry({
			workspaceId: input.workspaceId,
			periodId: input.data.periodId
		});
	}

	const accountIds = input.data.lines.map((line) => line.accountId);
	const accounts = await getAccountingAccountsByIds({
		workspaceId: input.workspaceId,
		accountIds
	});

	if (accounts.size !== new Set(accountIds).size) {
		throw new Error('One or more accounts are invalid or inactive');
	}

	const now = new Date();
	const collection = await getAccountingJournalEntriesCollection<AccountingJournalEntryDocument>();
	const document: AccountingJournalEntryDocument = {
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		periodId: new ObjectId(input.data.periodId),
		entryDate: input.data.entryDate,
		reference: input.data.reference || null,
		memo: input.data.memo || null,
		source,
		status: 'posted',
		lines: input.data.lines.map((line) => {
			const account = accounts.get(line.accountId);
			if (!account) {
				throw new Error('Account not found');
			}

			return {
				accountId: new ObjectId(line.accountId),
				accountCode: account.code,
				accountName: account.name,
				description: line.description || null,
				debitCents: line.debitCents,
				creditCents: line.creditCents
			};
		}),
		createdByUserId: new ObjectId(input.userId),
		createdAt: now,
		updatedAt: now
	};

	await collection.insertOne(document);
	return toJournalDto(document);
}
