import { MongoClient, type Db } from 'mongodb';
import { env } from '$env/dynamic/private';

const globalForMongo = globalThis as typeof globalThis & {
	_mongoClientPromise?: Promise<MongoClient>;
};

function getMongoUri(): string | undefined {
	return env.MONGODB_URI;
}

function getDbName(): string {
	return env.MONGODB_DB_NAME ?? 'urx-workspace';
}

function createClientPromise(): Promise<MongoClient> {
	const uri = getMongoUri();

	if (!uri) {
		return Promise.reject(new Error('MONGODB_URI is not configured'));
	}

	const client = new MongoClient(uri);

	if (import.meta.env.DEV) {
		if (!globalForMongo._mongoClientPromise) {
			globalForMongo._mongoClientPromise = client.connect();
		}

		return globalForMongo._mongoClientPromise;
	}

	return client.connect();
}

export async function getDb(): Promise<Db> {
	const client = await createClientPromise();
	return client.db(getDbName());
}

export async function pingDb(): Promise<{ ok: true; latencyMs: number } | { ok: false; error: string }> {
	if (!getMongoUri()) {
		return { ok: false, error: 'MONGODB_URI is not configured' };
	}

	const start = Date.now();

	try {
		const db = await getDb();
		await db.command({ ping: 1 });
		return { ok: true, latencyMs: Date.now() - start };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Database ping failed';
		return { ok: false, error: message };
	}
}
