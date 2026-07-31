import type { UserDocument, TermsConsent } from '$lib/shared/models/user';
import { getUsersCollection } from '$lib/server/db/collections';

let userIndexesPromise: Promise<void> | null = null;

export async function ensureUserIndexes(): Promise<void> {
	if (!userIndexesPromise) {
		userIndexesPromise = (async () => {
			const users = await getUsersCollection();
			await users.createIndex({ email: 1 }, { unique: true });
		})().catch((error) => {
			userIndexesPromise = null;
			throw error;
		});
	}

	return userIndexesPromise;
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
				firstName: 1,
				lastName: 1,
				createdAt: 1,
				updatedAt: 1
			}
		}
	);
}

export async function createUser(input: {
	email: string;
	passwordHash: string;
	firstName: string;
	lastName: string;
	termsConsent?: TermsConsent;
}): Promise<UserDocument> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();
	const email = input.email.trim().toLowerCase();
	const firstName = input.firstName.trim();
	const lastName = input.lastName.trim();

	const result = await users.insertOne({
		email,
		passwordHash: input.passwordHash,
		firstName,
		lastName,
		termsConsent: input.termsConsent,
		createdAt: now,
		updatedAt: now
	} as UserDocument);

	return {
		_id: result.insertedId,
		email,
		passwordHash: input.passwordHash,
		firstName,
		lastName,
		termsConsent: input.termsConsent,
		createdAt: now,
		updatedAt: now
	};
}
