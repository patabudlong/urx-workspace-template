import { MongoClient, ServerApiVersion, type Db, type MongoClientOptions } from 'mongodb';
import { env } from '$env/dynamic/private';
import { resolveMongoDbName, resolveMongoUri, type MongoTarget } from './resolve-mongo-uri';

const globalForMongo = globalThis as typeof globalThis & {
	_mongoClientPromise?: Promise<MongoClient>;
	_mongoClientUri?: string;
};

function getMongoEnv() {
	return {
		MONGODB_TARGET: env.MONGODB_TARGET,
		MONGODB_URI: env.MONGODB_URI,
		MONGODB_URI_LOCAL: env.MONGODB_URI_LOCAL,
		MONGODB_URI_ATLAS: env.MONGODB_URI_ATLAS,
		MONGODB_DB_NAME: env.MONGODB_DB_NAME
	};
}

function getResolvedMongo() {
	return resolveMongoUri(getMongoEnv());
}

function getDbName(): string {
	return resolveMongoDbName(getMongoEnv());
}

/** Atlas SRV URIs and known Atlas hosts get Stable API. */
function isAtlasUri(uri: string): boolean {
	return uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');
}

function getClientOptions(uri: string): MongoClientOptions {
	if (!isAtlasUri(uri)) {
		return {};
	}

	return {
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true
		}
	};
}

function createClientPromise(): Promise<MongoClient> {
	const { uri } = getResolvedMongo();

	if (!uri) {
		return Promise.reject(
			new Error(
				'MongoDB URI is not configured. Set MONGODB_URI_LOCAL / MONGODB_URI_ATLAS and MONGODB_TARGET.'
			)
		);
	}

	if (!globalForMongo._mongoClientPromise || globalForMongo._mongoClientUri !== uri) {
		globalForMongo._mongoClientUri = uri;
		const client = new MongoClient(uri, getClientOptions(uri));
		globalForMongo._mongoClientPromise = client.connect();
	}

	return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
	const client = await createClientPromise();
	return client.db(getDbName());
}

export async function pingDb(): Promise<
	| { ok: true; latencyMs: number; target: MongoTarget }
	| { ok: false; error: string; target: MongoTarget }
> {
	const { target, uri } = getResolvedMongo();

	if (!uri) {
		return {
			ok: false,
			target,
			error: `MongoDB URI for target "${target}" is not configured`
		};
	}

	const start = Date.now();

	try {
		const db = await getDb();
		await db.command({ ping: 1 });
		return { ok: true, latencyMs: Date.now() - start, target };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Database ping failed';
		return { ok: false, error: message, target };
	}
}
