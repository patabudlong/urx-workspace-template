import type { UserDocument } from '$lib/shared/models/user';
import { getUsersCollection } from '$lib/server/db/collections';

export async function ensureUserIndexes(): Promise<void> {
	const users = await getUsersCollection();
	await users.createIndex({ email: 1 }, { unique: true });
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();

	return users.findOne(
		{ email: email.trim().toLowerCase() },
		{
			projection: {
				_id: 1,
				email: 1,
				passwordHash: 1,
				name: 1,
				createdAt: 1,
				updatedAt: 1
			}
		}
	);
}

export async function createUser(input: {
	email: string;
	passwordHash: string;
	name?: string;
}): Promise<UserDocument> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();
	const email = input.email.trim().toLowerCase();

	const result = await users.insertOne({
		email,
		passwordHash: input.passwordHash,
		name: input.name,
		createdAt: now,
		updatedAt: now
	} as UserDocument);

	return {
		_id: result.insertedId,
		email,
		passwordHash: input.passwordHash,
		name: input.name,
		createdAt: now,
		updatedAt: now
	};
}
