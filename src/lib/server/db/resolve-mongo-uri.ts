export type MongoTarget = 'local' | 'atlas';

export type MongoEnv = {
	MONGODB_TARGET?: string;
	MONGODB_URI?: string;
	MONGODB_URI_LOCAL?: string;
	MONGODB_URI_ATLAS?: string;
	MONGODB_DB_NAME?: string;
};

/** Resolve active Mongo URI from `MONGODB_TARGET` (`local` | `atlas`). */
export function resolveMongoUri(env: MongoEnv): { target: MongoTarget; uri: string | undefined } {
	const raw = (env.MONGODB_TARGET ?? 'local').trim().toLowerCase();
	const target: MongoTarget = raw === 'atlas' ? 'atlas' : 'local';

	const uri =
		target === 'atlas'
			? env.MONGODB_URI_ATLAS?.trim() || env.MONGODB_URI?.trim()
			: env.MONGODB_URI_LOCAL?.trim() || env.MONGODB_URI?.trim();

	return { target, uri: uri || undefined };
}

export function resolveMongoDbName(env: MongoEnv): string {
	return env.MONGODB_DB_NAME?.trim() || 'urx-workspace';
}
