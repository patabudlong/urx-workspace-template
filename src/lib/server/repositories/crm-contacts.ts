import type { CrmContactDocument, CrmContactDto } from '$lib/shared/models/crm-contact';
import { getCrmContactsCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';
import type { CreateCrmContactInput } from '$lib/shared/crm/schemas';

let crmContactIndexesPromise: Promise<void> | null = null;

const CRM_CONTACT_PROJECTION = {
	_id: 1,
	workspaceId: 1,
	firstName: 1,
	lastName: 1,
	email: 1,
	phone: 1,
	title: 1,
	companyId: 1,
	notes: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toCrmContactDto(doc: CrmContactDocument): CrmContactDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		firstName: doc.firstName,
		lastName: doc.lastName,
		email: doc.email,
		phone: doc.phone,
		title: doc.title,
		companyId: doc.companyId?.toString() ?? null,
		notes: doc.notes,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

async function ensureCrmContactIndexes(): Promise<void> {
	if (!crmContactIndexesPromise) {
		crmContactIndexesPromise = (async () => {
			const collection = await getCrmContactsCollection();
			await collection.createIndex({ workspaceId: 1, lastName: 1, firstName: 1 });
			await collection.createIndex({ workspaceId: 1, email: 1 });
			await collection.createIndex({ workspaceId: 1, companyId: 1 });
		})();
	}

	await crmContactIndexesPromise;
}

export async function countCrmContactsForWorkspace(workspaceId: string): Promise<number> {
	await ensureCrmContactIndexes();
	const collection = await getCrmContactsCollection();
	return collection.countDocuments({ workspaceId: new ObjectId(workspaceId) });
}

export async function listCrmContacts(input: {
	workspaceId: string;
	page: number;
	limit: number;
	search?: string;
}): Promise<{ items: CrmContactDto[]; total: number }> {
	await ensureCrmContactIndexes();

	const collection = await getCrmContactsCollection<CrmContactDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const filter: Record<string, unknown> = { workspaceId: workspaceObjectId };

	if (input.search) {
		const pattern = new RegExp(input.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		filter.$or = [
			{ firstName: pattern },
			{ lastName: pattern },
			{ email: pattern },
			{ phone: pattern }
		];
	}

	const skip = (input.page - 1) * input.limit;
	const [docs, total] = await Promise.all([
		collection
			.find(filter, { projection: CRM_CONTACT_PROJECTION })
			.sort({ lastName: 1, firstName: 1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	return {
		items: docs.map(toCrmContactDto),
		total
	};
}

export async function listCrmContactsForWorkspace(workspaceId: string): Promise<CrmContactDto[]> {
	const { items } = await listCrmContacts({
		workspaceId,
		page: 1,
		limit: 100
	});

	return items;
}

export async function getCrmContactForWorkspace(input: {
	workspaceId: string;
	contactId: string;
}): Promise<CrmContactDto | null> {
	await ensureCrmContactIndexes();

	const collection = await getCrmContactsCollection<CrmContactDocument>();
	const doc = await collection.findOne(
		{
			_id: new ObjectId(input.contactId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: CRM_CONTACT_PROJECTION }
	);

	return doc ? toCrmContactDto(doc) : null;
}

export async function createCrmContact(input: {
	workspaceId: string;
	data: CreateCrmContactInput;
}): Promise<CrmContactDto> {
	await ensureCrmContactIndexes();

	const now = new Date();
	const collection = await getCrmContactsCollection<CrmContactDocument>();
	const result = await collection.insertOne({
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		firstName: input.data.firstName,
		lastName: input.data.lastName,
		email: input.data.email ?? null,
		phone: input.data.phone ?? null,
		title: input.data.title ?? null,
		companyId: input.data.companyId ? new ObjectId(input.data.companyId) : null,
		notes: input.data.notes ?? null,
		createdAt: now,
		updatedAt: now
	});

	const doc = await collection.findOne(
		{ _id: result.insertedId },
		{ projection: CRM_CONTACT_PROJECTION }
	);

	if (!doc) {
		throw new Error('Failed to create CRM contact');
	}

	return toCrmContactDto(doc);
}
