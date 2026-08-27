import type { AccountingAccountDocument, AccountingAccountDto } from '$lib/shared/models/accounting-account';
import {
	getAccountingAccountsCollection,
	getAccountingPeriodsCollection
} from '$lib/server/db/collections';
import { PH_SME_COA_TEMPLATE } from '$lib/shared/accounting/ph/coa-template';
import { buildFiscalYearPeriods } from '$lib/server/accounting/periods';
import type { AccountingPeriodDocument } from '$lib/shared/models/accounting-period';
import { ObjectId } from 'mongodb';

let accountingAccountsIndexesPromise: Promise<void> | null = null;
let accountingPeriodsIndexesPromise: Promise<void> | null = null;

const ACCOUNT_PROJECTION = {
	_id: 1,
	workspaceId: 1,
	code: 1,
	name: 1,
	type: 1,
	description: 1,
	isActive: 1,
	isSystem: 1
} as const;

function toAccountDto(doc: AccountingAccountDocument): AccountingAccountDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		code: doc.code,
		name: doc.name,
		type: doc.type,
		description: doc.description ?? null,
		isActive: doc.isActive,
		isSystem: doc.isSystem
	};
}

async function ensureAccountingAccountsIndexes(): Promise<void> {
	if (!accountingAccountsIndexesPromise) {
		accountingAccountsIndexesPromise = (async () => {
			const collection = await getAccountingAccountsCollection();
			await collection.createIndex({ workspaceId: 1, code: 1 }, { unique: true });
			await collection.createIndex({ workspaceId: 1, type: 1, code: 1 });
		})();
	}

	await accountingAccountsIndexesPromise;
}

async function ensureAccountingPeriodsIndexes(): Promise<void> {
	if (!accountingPeriodsIndexesPromise) {
		accountingPeriodsIndexesPromise = (async () => {
			const collection = await getAccountingPeriodsCollection();
			await collection.createIndex({ workspaceId: 1, year: 1, month: 1 }, { unique: true });
			await collection.createIndex({ workspaceId: 1, status: 1, year: 1, month: 1 });
		})();
	}

	await accountingPeriodsIndexesPromise;
}

export async function seedAccountingWorkspace(input: {
	workspaceId: string;
	fiscalYearStartMonth: number;
}): Promise<void> {
	await ensureAccountingAccountsIndexes();
	await ensureAccountingPeriodsIndexes();

	const workspaceObjectId = new ObjectId(input.workspaceId);
	const accountsCollection = await getAccountingAccountsCollection<AccountingAccountDocument>();
	const periodsCollection = await getAccountingPeriodsCollection<AccountingPeriodDocument>();
	const now = new Date();

	const existingAccounts = await accountsCollection.countDocuments({
		workspaceId: workspaceObjectId
	});

	if (existingAccounts === 0) {
		await accountsCollection.insertMany(
			PH_SME_COA_TEMPLATE.map((account) => ({
				_id: new ObjectId(),
				workspaceId: workspaceObjectId,
				code: account.code,
				name: account.name,
				type: account.type,
				description: account.description ?? null,
				isActive: true,
				isSystem: true,
				createdAt: now,
				updatedAt: now
			}))
		);
	}

	const currentYear = now.getUTCFullYear();
	const existingPeriods = await periodsCollection.countDocuments({
		workspaceId: workspaceObjectId,
		year: currentYear
	});

	if (existingPeriods === 0) {
		const periods = buildFiscalYearPeriods({
			year: currentYear,
			fiscalYearStartMonth: input.fiscalYearStartMonth
		});

		await periodsCollection.insertMany(
			periods.map((period) => ({
				_id: new ObjectId(),
				workspaceId: workspaceObjectId,
				year: period.year,
				month: period.month,
				label: period.label,
				status: 'open' as const,
				startDate: period.startDate,
				endDate: period.endDate,
				createdAt: now,
				updatedAt: now
			}))
		);
	}
}

export async function listAccountingAccountsForWorkspace(
	workspaceId: string
): Promise<AccountingAccountDto[]> {
	await ensureAccountingAccountsIndexes();
	const collection = await getAccountingAccountsCollection<AccountingAccountDocument>();
	const docs = await collection
		.find({ workspaceId: new ObjectId(workspaceId) }, { projection: ACCOUNT_PROJECTION })
		.sort({ code: 1 })
		.toArray();

	return docs.map(toAccountDto);
}

export async function countAccountingAccountsForWorkspace(workspaceId: string): Promise<number> {
	await ensureAccountingAccountsIndexes();
	const collection = await getAccountingAccountsCollection();
	return collection.countDocuments({ workspaceId: new ObjectId(workspaceId) });
}

export async function getAccountingAccountsByIds(input: {
	workspaceId: string;
	accountIds: string[];
}): Promise<Map<string, AccountingAccountDto>> {
	await ensureAccountingAccountsIndexes();
	const collection = await getAccountingAccountsCollection<AccountingAccountDocument>();
	const objectIds = input.accountIds.map((id) => new ObjectId(id));
	const docs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				_id: { $in: objectIds },
				isActive: true
			},
			{ projection: ACCOUNT_PROJECTION }
		)
		.toArray();

	return new Map(docs.map((doc) => [doc._id.toString(), toAccountDto(doc)]));
}
