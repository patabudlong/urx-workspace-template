import {
	CRM_SEED_COMPANIES,
	CRM_SEED_CONTACTS,
	CRM_SEED_DEALS
} from '$lib/server/crm/seed-data';
import {
	getCrmCompaniesCollection,
	getCrmContactsCollection,
	getCrmDealsCollection
} from '$lib/server/db/collections';
import type { CrmCompanyDocument } from '$lib/shared/models/crm-company';
import type { CrmContactDocument } from '$lib/shared/models/crm-contact';
import type { CrmDealDocument } from '$lib/shared/models/crm-deal';
import type { CrmSeedStatus } from '$lib/shared/crm/seed';
import { ObjectId } from 'mongodb';

const SEED_FILTER = { isSeed: true } as const;

let crmSeedIndexesPromise: Promise<void> | null = null;

async function ensureCrmSeedIndexes(): Promise<void> {
	if (!crmSeedIndexesPromise) {
		crmSeedIndexesPromise = (async () => {
			const [contacts, companies, deals] = await Promise.all([
				getCrmContactsCollection(),
				getCrmCompaniesCollection(),
				getCrmDealsCollection()
			]);

			await Promise.all([
				contacts.createIndex({ workspaceId: 1, isSeed: 1 }),
				companies.createIndex({ workspaceId: 1, isSeed: 1 }),
				deals.createIndex({ workspaceId: 1, isSeed: 1 })
			]);
		})();
	}

	await crmSeedIndexesPromise;
}

export async function getCrmSeedStatusForWorkspace(workspaceId: string): Promise<CrmSeedStatus> {
	await ensureCrmSeedIndexes();

	const workspaceObjectId = new ObjectId(workspaceId);
	const filter = { workspaceId: workspaceObjectId, ...SEED_FILTER };
	const [companiesCollection, contactsCollection, dealsCollection] = await Promise.all([
		getCrmCompaniesCollection(),
		getCrmContactsCollection(),
		getCrmDealsCollection()
	]);

	const [companyCount, contactCount, dealCount] = await Promise.all([
		companiesCollection.countDocuments(filter),
		contactsCollection.countDocuments(filter),
		dealsCollection.countDocuments(filter)
	]);

	return {
		seeded: companyCount > 0 || contactCount > 0 || dealCount > 0,
		companyCount,
		contactCount,
		dealCount
	};
}

export async function seedCrmWorkspace(workspaceId: string): Promise<CrmSeedStatus> {
	await ensureCrmSeedIndexes();

	const existing = await getCrmSeedStatusForWorkspace(workspaceId);
	if (existing.seeded) {
		throw new Error('CRM seed already exists');
	}

	const workspaceObjectId = new ObjectId(workspaceId);
	const now = new Date();
	const [companiesCollection, contactsCollection, dealsCollection] = await Promise.all([
		getCrmCompaniesCollection<CrmCompanyDocument>(),
		getCrmContactsCollection<CrmContactDocument>(),
		getCrmDealsCollection<CrmDealDocument>()
	]);

	const companyIds = new Map<string, ObjectId>();
	for (const company of CRM_SEED_COMPANIES) {
		const companyId = new ObjectId();
		companyIds.set(company.key, companyId);
		await companiesCollection.insertOne({
			_id: companyId,
			workspaceId: workspaceObjectId,
			name: company.name,
			domain: company.domain,
			industry: company.industry,
			phone: company.phone,
			notes: company.notes,
			isSeed: true,
			createdAt: now,
			updatedAt: now
		});
	}

	const contactIds = new Map<string, ObjectId>();
	for (const contact of CRM_SEED_CONTACTS) {
		const companyId = companyIds.get(contact.companyKey);
		if (!companyId) {
			throw new Error(`Missing seed company for contact: ${contact.key}`);
		}

		const contactId = new ObjectId();
		contactIds.set(contact.key, contactId);
		await contactsCollection.insertOne({
			_id: contactId,
			workspaceId: workspaceObjectId,
			firstName: contact.firstName,
			lastName: contact.lastName,
			email: contact.email,
			phone: contact.phone,
			title: contact.title,
			companyId,
			notes: contact.notes,
			isSeed: true,
			createdAt: now,
			updatedAt: now
		});
	}

	for (const deal of CRM_SEED_DEALS) {
		const companyId = companyIds.get(deal.companyKey);
		const contactId = contactIds.get(deal.contactKey);
		if (!companyId || !contactId) {
			throw new Error(`Missing seed relations for deal: ${deal.title}`);
		}

		const expectedCloseDate = new Date(now);
		expectedCloseDate.setUTCDate(expectedCloseDate.getUTCDate() + deal.expectedCloseDateOffsetDays);

		await dealsCollection.insertOne({
			_id: new ObjectId(),
			workspaceId: workspaceObjectId,
			title: deal.title,
			stage: deal.stage,
			value: deal.value,
			currency: 'PHP',
			contactId,
			companyId,
			expectedCloseDate,
			notes: deal.notes,
			isSeed: true,
			createdAt: now,
			updatedAt: now
		});
	}

	return getCrmSeedStatusForWorkspace(workspaceId);
}

export async function deleteCrmSeedForWorkspace(workspaceId: string): Promise<CrmSeedStatus> {
	await ensureCrmSeedIndexes();

	const existing = await getCrmSeedStatusForWorkspace(workspaceId);
	if (!existing.seeded) {
		throw new Error('CRM seed not found');
	}

	const workspaceObjectId = new ObjectId(workspaceId);
	const filter = { workspaceId: workspaceObjectId, ...SEED_FILTER };
	const [dealsCollection, contactsCollection, companiesCollection] = await Promise.all([
		getCrmDealsCollection(),
		getCrmContactsCollection(),
		getCrmCompaniesCollection()
	]);

	await dealsCollection.deleteMany(filter);
	await contactsCollection.deleteMany(filter);
	await companiesCollection.deleteMany(filter);

	return getCrmSeedStatusForWorkspace(workspaceId);
}
