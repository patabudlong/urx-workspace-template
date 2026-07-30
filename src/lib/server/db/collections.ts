import type { Collection, Document } from 'mongodb';
import { getDb } from '$lib/server/db/client';

/** Register collection names here as the schema grows. */
export const CollectionNames = {
	users: 'users'
} as const;

type CollectionName = keyof typeof CollectionNames;

export async function getCollection<T extends Document = Document>(
	name: CollectionName
): Promise<Collection<T>> {
	const db = await getDb();
	return db.collection<T>(CollectionNames[name]);
}

export async function getUsersCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('users');
}
