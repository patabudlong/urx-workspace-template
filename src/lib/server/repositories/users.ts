import type { UserDocument, TermsConsent } from '$lib/shared/models/user';
import { getUsersCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';

let userIndexesPromise: Promise<void> | null = null;

export async function ensureUserIndexes(): Promise<void> {
	if (!userIndexesPromise) {
		userIndexesPromise = (async () => {
			const users = await getUsersCollection();
			await users.createIndex({ email: 1 }, { unique: true });
			await users.createIndex({ googleId: 1 }, { unique: true, sparse: true });
		})().catch((error) => {
			userIndexesPromise = null;
			throw error;
		});
	}

	return userIndexesPromise;
}

const userProjection = {
	_id: 1,
	email: 1,
	passwordHash: 1,
	googleId: 1,
	firstName: 1,
	lastName: 1,
	termsConsent: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();

	return users.findOne({ email: email.trim().toLowerCase() }, { projection: userProjection });
}

export async function findUserByGoogleId(googleId: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();

	return users.findOne({ googleId }, { projection: userProjection });
}

export async function createUser(input: {
	email: string;
	passwordHash?: string;
	googleId?: string;
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
		googleId: input.googleId,
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
		googleId: input.googleId,
		firstName,
		lastName,
		termsConsent: input.termsConsent,
		createdAt: now,
		updatedAt: now
	};
}

export async function linkGoogleAccount(userId: string, googleId: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.findOneAndUpdate(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				googleId,
				updatedAt: now
			}
		},
		{ returnDocument: 'after', projection: userProjection }
	);

	return result ?? null;
}
