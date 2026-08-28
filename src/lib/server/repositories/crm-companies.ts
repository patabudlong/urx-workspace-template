import type { CrmCompanyDocument, CrmCompanyDto } from '$lib/shared/models/crm-company';
import { getCrmCompaniesCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';
import type { CreateCrmCompanyInput } from '$lib/shared/crm/schemas';

let crmCompanyIndexesPromise: Promise<void> | null = null;

const CRM_COMPANY_PROJECTION = {
	_id: 1,
	workspaceId: 1,
	name: 1,
	domain: 1,
	industry: 1,
	phone: 1,
	notes: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toCrmCompanyDto(doc: CrmCompanyDocument): CrmCompanyDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		name: doc.name,
		domain: doc.domain,
		industry: doc.industry,
		phone: doc.phone,
		notes: doc.notes,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

async function ensureCrmCompanyIndexes(): Promise<void> {
	if (!crmCompanyIndexesPromise) {
		crmCompanyIndexesPromise = (async () => {
			const collection = await getCrmCompaniesCollection();
			await collection.createIndex({ workspaceId: 1, name: 1 });
			await collection.createIndex({ workspaceId: 1, domain: 1 });
		})();
	}

	await crmCompanyIndexesPromise;
}

export async function countCrmCompaniesForWorkspace(workspaceId: string): Promise<number> {
	await ensureCrmCompanyIndexes();
	const collection = await getCrmCompaniesCollection();
	return collection.countDocuments({ workspaceId: new ObjectId(workspaceId) });
}

export async function listCrmCompanies(input: {
	workspaceId: string;
	page: number;
	limit: number;
	search?: string;
}): Promise<{ items: CrmCompanyDto[]; total: number }> {
	await ensureCrmCompanyIndexes();

	const collection = await getCrmCompaniesCollection<CrmCompanyDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const filter: Record<string, unknown> = { workspaceId: workspaceObjectId };

	if (input.search) {
		const pattern = new RegExp(input.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		filter.$or = [{ name: pattern }, { domain: pattern }, { industry: pattern }];
	}

	const skip = (input.page - 1) * input.limit;
	const [docs, total] = await Promise.all([
		collection
			.find(filter, { projection: CRM_COMPANY_PROJECTION })
			.sort({ name: 1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	return {
		items: docs.map(toCrmCompanyDto),
		total
	};
}

export async function listCrmCompaniesForWorkspace(workspaceId: string): Promise<CrmCompanyDto[]> {
	const { items } = await listCrmCompanies({
		workspaceId,
		page: 1,
		limit: 100
	});

	return items;
}

export async function getCrmCompanyForWorkspace(input: {
	workspaceId: string;
	companyId: string;
}): Promise<CrmCompanyDto | null> {
	await ensureCrmCompanyIndexes();

	const collection = await getCrmCompaniesCollection<CrmCompanyDocument>();
	const doc = await collection.findOne(
		{
			_id: new ObjectId(input.companyId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: CRM_COMPANY_PROJECTION }
	);

	return doc ? toCrmCompanyDto(doc) : null;
}

export async function createCrmCompany(input: {
	workspaceId: string;
	data: CreateCrmCompanyInput;
}): Promise<CrmCompanyDto> {
	await ensureCrmCompanyIndexes();

	const now = new Date();
	const collection = await getCrmCompaniesCollection<CrmCompanyDocument>();
	const result = await collection.insertOne({
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		name: input.data.name,
		domain: input.data.domain ?? null,
		industry: input.data.industry ?? null,
		phone: input.data.phone ?? null,
		notes: input.data.notes ?? null,
		createdAt: now,
		updatedAt: now
	});

	const doc = await collection.findOne(
		{ _id: result.insertedId },
		{ projection: CRM_COMPANY_PROJECTION }
	);

	if (!doc) {
		throw new Error('Failed to create CRM company');
	}

	return toCrmCompanyDto(doc);
}
