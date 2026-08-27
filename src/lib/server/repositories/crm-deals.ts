import type { CrmDealDocument, CrmDealDto } from '$lib/shared/models/crm-deal';
import { CRM_DEAL_STAGES } from '$lib/shared/models/crm-deal';
import { getCrmDealsCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';
import type { CreateCrmDealInput } from '$lib/shared/crm/schemas';
import type { UpdateCrmDealInput } from '$lib/shared/crm/schemas';

let crmDealIndexesPromise: Promise<void> | null = null;

const CRM_DEAL_PROJECTION = {
	_id: 1,
	workspaceId: 1,
	title: 1,
	stage: 1,
	value: 1,
	currency: 1,
	contactId: 1,
	companyId: 1,
	expectedCloseDate: 1,
	notes: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toCrmDealDto(doc: CrmDealDocument): CrmDealDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		title: doc.title,
		stage: doc.stage,
		value: doc.value,
		currency: doc.currency,
		contactId: doc.contactId?.toString() ?? null,
		companyId: doc.companyId?.toString() ?? null,
		expectedCloseDate: doc.expectedCloseDate?.toISOString() ?? null,
		notes: doc.notes,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

async function ensureCrmDealIndexes(): Promise<void> {
	if (!crmDealIndexesPromise) {
		crmDealIndexesPromise = (async () => {
			const collection = await getCrmDealsCollection();
			await collection.createIndex({ workspaceId: 1, stage: 1, updatedAt: -1 });
			await collection.createIndex({ workspaceId: 1, companyId: 1 });
			await collection.createIndex({ workspaceId: 1, contactId: 1 });
		})();
	}

	await crmDealIndexesPromise;
}

export async function countCrmDealsForWorkspace(workspaceId: string): Promise<number> {
	await ensureCrmDealIndexes();
	const collection = await getCrmDealsCollection();
	return collection.countDocuments({ workspaceId: new ObjectId(workspaceId) });
}

export async function countOpenCrmDealsForWorkspace(workspaceId: string): Promise<number> {
	await ensureCrmDealIndexes();
	const collection = await getCrmDealsCollection();
	return collection.countDocuments({
		workspaceId: new ObjectId(workspaceId),
		stage: { $nin: [CRM_DEAL_STAGES.WON, CRM_DEAL_STAGES.LOST] }
	});
}

export async function listCrmDeals(input: {
	workspaceId: string;
	page: number;
	limit: number;
	search?: string;
}): Promise<{ items: CrmDealDto[]; total: number }> {
	await ensureCrmDealIndexes();

	const collection = await getCrmDealsCollection<CrmDealDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const filter: Record<string, unknown> = { workspaceId: workspaceObjectId };

	if (input.search) {
		const pattern = new RegExp(input.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		filter.$or = [{ title: pattern }, { notes: pattern }];
	}

	const skip = (input.page - 1) * input.limit;
	const [docs, total] = await Promise.all([
		collection
			.find(filter, { projection: CRM_DEAL_PROJECTION })
			.sort({ updatedAt: -1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	return {
		items: docs.map(toCrmDealDto),
		total
	};
}

export async function createCrmDeal(input: {
	workspaceId: string;
	data: CreateCrmDealInput;
}): Promise<CrmDealDto> {
	await ensureCrmDealIndexes();

	const now = new Date();
	const collection = await getCrmDealsCollection<CrmDealDocument>();
	const result = await collection.insertOne({
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		title: input.data.title,
		stage: input.data.stage ?? CRM_DEAL_STAGES.LEAD,
		value: input.data.value ?? null,
		currency: input.data.currency ?? 'PHP',
		contactId: input.data.contactId ? new ObjectId(input.data.contactId) : null,
		companyId: input.data.companyId ? new ObjectId(input.data.companyId) : null,
		expectedCloseDate: input.data.expectedCloseDate
			? new Date(input.data.expectedCloseDate)
			: null,
		notes: input.data.notes ?? null,
		createdAt: now,
		updatedAt: now
	});

	const doc = await collection.findOne({ _id: result.insertedId }, { projection: CRM_DEAL_PROJECTION });

	if (!doc) {
		throw new Error('Failed to create CRM deal');
	}

	return toCrmDealDto(doc);
}

export async function getCrmDealForWorkspace(input: {
	workspaceId: string;
	dealId: string;
}): Promise<CrmDealDto | null> {
	await ensureCrmDealIndexes();

	const collection = await getCrmDealsCollection<CrmDealDocument>();
	const doc = await collection.findOne(
		{
			_id: new ObjectId(input.dealId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: CRM_DEAL_PROJECTION }
	);

	return doc ? toCrmDealDto(doc) : null;
}

export async function updateCrmDealForWorkspace(input: {
	workspaceId: string;
	dealId: string;
	data: UpdateCrmDealInput;
}): Promise<CrmDealDto | null> {
	await ensureCrmDealIndexes();

	const collection = await getCrmDealsCollection<CrmDealDocument>();
	const updates: Partial<CrmDealDocument> = {
		updatedAt: new Date()
	};

	if (input.data.stage !== undefined) {
		updates.stage = input.data.stage;
	}

	if (input.data.value !== undefined) {
		updates.value = input.data.value;
	}

	if (input.data.currency !== undefined) {
		updates.currency = input.data.currency;
	}

	if (input.data.notes !== undefined) {
		updates.notes = input.data.notes;
	}

	if (input.data.expectedCloseDate !== undefined) {
		updates.expectedCloseDate =
			input.data.expectedCloseDate && input.data.expectedCloseDate.length > 0
				? new Date(input.data.expectedCloseDate)
				: null;
	}

	const result = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.dealId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ $set: updates },
		{ returnDocument: 'after', projection: CRM_DEAL_PROJECTION }
	);

	return result ? toCrmDealDto(result) : null;
}
