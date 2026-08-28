import { PM_SEED_PROJECTS } from '$lib/server/project-management/seed-data';
import { getPmProjectsCollection } from '$lib/server/db/collections';
import type { PmProjectDocument } from '$lib/shared/models/pm-project';
import type { PmSeedStatus } from '$lib/shared/project-management/seed';
import { ObjectId } from 'mongodb';

const SEED_FILTER = { isSeed: true } as const;

let pmSeedIndexesPromise: Promise<void> | null = null;

async function ensurePmSeedIndexes(): Promise<void> {
	if (!pmSeedIndexesPromise) {
		pmSeedIndexesPromise = (async () => {
			const collection = await getPmProjectsCollection();
			await collection.createIndex({ workspaceId: 1, isSeed: 1 });
		})();
	}

	await pmSeedIndexesPromise;
}

export async function getPmSeedStatusForWorkspace(workspaceId: string): Promise<PmSeedStatus> {
	await ensurePmSeedIndexes();

	const workspaceObjectId = new ObjectId(workspaceId);
	const filter = { workspaceId: workspaceObjectId, ...SEED_FILTER };
	const collection = await getPmProjectsCollection();
	const projectCount = await collection.countDocuments(filter);

	return {
		seeded: projectCount > 0,
		projectCount
	};
}

export async function seedPmWorkspace(workspaceId: string): Promise<PmSeedStatus> {
	await ensurePmSeedIndexes();

	const existing = await getPmSeedStatusForWorkspace(workspaceId);
	if (existing.seeded) {
		throw new Error('PM seed already exists');
	}

	const workspaceObjectId = new ObjectId(workspaceId);
	const now = new Date();
	const collection = await getPmProjectsCollection<PmProjectDocument>();

	for (const project of PM_SEED_PROJECTS) {
		const dueDate = new Date(now);
		dueDate.setUTCDate(dueDate.getUTCDate() + project.dueDateOffsetDays);

		await collection.insertOne({
			_id: new ObjectId(),
			workspaceId: workspaceObjectId,
			title: project.title,
			description: project.description,
			status: project.status,
			clientName: project.clientName,
			projectTypes: project.projectTypes,
			projectUrl: project.projectUrl,
			crmCompanyId: null,
			crmContactId: null,
			dueDate,
			notes: project.notes,
			isSeed: true,
			onboarding: null,
			createdAt: now,
			updatedAt: now
		});
	}

	return getPmSeedStatusForWorkspace(workspaceId);
}

export async function deletePmSeedForWorkspace(workspaceId: string): Promise<PmSeedStatus> {
	await ensurePmSeedIndexes();

	const existing = await getPmSeedStatusForWorkspace(workspaceId);
	if (!existing.seeded) {
		throw new Error('PM seed not found');
	}

	const workspaceObjectId = new ObjectId(workspaceId);
	const filter = { workspaceId: workspaceObjectId, ...SEED_FILTER };
	const collection = await getPmProjectsCollection();
	await collection.deleteMany(filter);

	return getPmSeedStatusForWorkspace(workspaceId);
}
