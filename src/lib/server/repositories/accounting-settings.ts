import type { AccountingSettingsDocument, AccountingSettingsDto } from '$lib/shared/models/accounting-settings';
import { getAccountingSettingsCollection } from '$lib/server/db/collections';
import { getDefaultAccountingTimezone } from '$lib/server/accounting/config';
import type { AccountingSettingsInput } from '$lib/shared/accounting/schemas';
import { createAccountingSettingsDefaults } from '$lib/shared/accounting/schemas';
import { seedAccountingWorkspace } from '$lib/server/repositories/accounting-accounts';
import { ObjectId } from 'mongodb';

let accountingSettingsIndexesPromise: Promise<void> | null = null;

const SETTINGS_PROJECTION = {
	workspaceId: 1,
	companyName: 1,
	tin: 1,
	addressLine1: 1,
	addressLine2: 1,
	city: 1,
	province: 1,
	fiscalYearStartMonth: 1,
	timezone: 1,
	baseCurrency: 1,
	jurisdiction: 1,
	configured: 1,
	updatedAt: 1
} as const;

function toSettingsDto(
	doc: AccountingSettingsDocument | null,
	workspaceId: string
): AccountingSettingsDto {
	if (!doc) {
		const defaults = createAccountingSettingsDefaults({
			timezone: getDefaultAccountingTimezone()
		});

		return {
			workspaceId,
			companyName: defaults.companyName,
			tin: null,
			addressLine1: null,
			addressLine2: null,
			city: null,
			province: null,
			fiscalYearStartMonth: defaults.fiscalYearStartMonth,
			timezone: defaults.timezone,
			baseCurrency: defaults.baseCurrency,
			jurisdiction: 'PH',
			configured: false,
			updatedAt: null
		};
	}

	return {
		workspaceId: doc.workspaceId.toString(),
		companyName: doc.companyName,
		tin: doc.tin ?? null,
		addressLine1: doc.addressLine1 ?? null,
		addressLine2: doc.addressLine2 ?? null,
		city: doc.city ?? null,
		province: doc.province ?? null,
		fiscalYearStartMonth: doc.fiscalYearStartMonth,
		timezone: doc.timezone,
		baseCurrency: doc.baseCurrency,
		jurisdiction: doc.jurisdiction,
		configured: doc.configured === true,
		updatedAt: doc.updatedAt.toISOString()
	};
}

async function ensureAccountingSettingsIndexes(): Promise<void> {
	if (!accountingSettingsIndexesPromise) {
		accountingSettingsIndexesPromise = (async () => {
			const collection = await getAccountingSettingsCollection();
			await collection.createIndex({ workspaceId: 1 }, { unique: true });
		})();
	}

	await accountingSettingsIndexesPromise;
}

export async function getAccountingSettingsForWorkspace(
	workspaceId: string
): Promise<AccountingSettingsDto> {
	await ensureAccountingSettingsIndexes();
	const collection = await getAccountingSettingsCollection<AccountingSettingsDocument>();
	const doc = await collection.findOne(
		{ workspaceId: new ObjectId(workspaceId) },
		{ projection: SETTINGS_PROJECTION }
	);

	return toSettingsDto(doc, workspaceId);
}

export async function upsertAccountingSettingsForWorkspace(input: {
	workspaceId: string;
	data: AccountingSettingsInput;
}): Promise<AccountingSettingsDto> {
	await ensureAccountingSettingsIndexes();
	const collection = await getAccountingSettingsCollection<AccountingSettingsDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const now = new Date();
	const existing = await collection.findOne(
		{ workspaceId: workspaceObjectId },
		{ projection: { _id: 1, configured: 1, seededAt: 1 } }
	);
	const shouldSeed = !existing?.seededAt;

	await collection.updateOne(
		{ workspaceId: workspaceObjectId },
		{
			$set: {
				companyName: input.data.companyName,
				tin: input.data.tin || null,
				addressLine1: input.data.addressLine1 || null,
				addressLine2: input.data.addressLine2 || null,
				city: input.data.city || null,
				province: input.data.province || null,
				fiscalYearStartMonth: input.data.fiscalYearStartMonth,
				timezone: input.data.timezone,
				baseCurrency: input.data.baseCurrency,
				jurisdiction: 'PH',
				configured: true,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				createdAt: now,
				seededAt: null
			}
		},
		{ upsert: true }
	);

	if (shouldSeed) {
		await seedAccountingWorkspace({
			workspaceId: input.workspaceId,
			fiscalYearStartMonth: input.data.fiscalYearStartMonth
		});
		await collection.updateOne(
			{ workspaceId: workspaceObjectId },
			{ $set: { seededAt: now } }
		);
	}

	return getAccountingSettingsForWorkspace(input.workspaceId);
}

export async function isAccountingConfiguredForWorkspace(workspaceId: string): Promise<boolean> {
	const settings = await getAccountingSettingsForWorkspace(workspaceId);
	return settings.configured;
}
