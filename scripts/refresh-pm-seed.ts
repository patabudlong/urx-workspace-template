import { MongoClient, ObjectId } from 'mongodb';
import { PM_SEED_PROJECTS } from '../src/lib/server/project-management/seed-data.ts';
import { loadEnvFile } from './load-env.ts';
import { resolveMongoDbName, resolveMongoUri } from '../src/lib/server/db/resolve-mongo-uri.ts';

const envPath = loadEnvFile();

if (!envPath) {
	console.warn('No .env file found — using process environment and defaults.');
}

async function main() {
	const { target, uri } = resolveMongoUri(process.env);
	const dbName = resolveMongoDbName(process.env);
	const client = new MongoClient(uri);

	try {
		await client.connect();
		const collection = client.db(dbName).collection('pm_projects');
		const workspaceIds = await collection.distinct('workspaceId', { isSeed: true });

		if (workspaceIds.length === 0) {
			console.log('No PM sample data found in this database.');
			return;
		}

		for (const workspaceId of workspaceIds) {
			const workspaceIdString = workspaceId.toString();
			const deleted = await collection.deleteMany({
				workspaceId: new ObjectId(workspaceIdString),
				isSeed: true
			});

			const now = new Date();

			for (const project of PM_SEED_PROJECTS) {
				const dueDate = new Date(now);
				dueDate.setUTCDate(dueDate.getUTCDate() + project.dueDateOffsetDays);

				await collection.insertOne({
					_id: new ObjectId(),
					workspaceId: new ObjectId(workspaceIdString),
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

			console.log(
				`Refreshed PM sample data for workspace ${workspaceIdString}: removed ${deleted.deletedCount}, inserted ${PM_SEED_PROJECTS.length}.`
			);
		}

		console.log(`Mongo target: ${target}`);
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
