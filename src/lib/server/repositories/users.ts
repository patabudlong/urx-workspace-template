import type { UserDocument, TermsConsent } from '$lib/shared/models/user';
import { buildNextPasswordHistory } from '$lib/shared/password-policy';
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
	passwordHistory: 1,
	googleId: 1,
	firstName: 1,
	lastName: 1,
	avatarUrl: 1,
	emailVerifiedAt: 1,
	termsConsent: 1,
	platformRole: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

export function isUserEmailVerified(user: UserDocument): boolean {
	return user.emailVerifiedAt != null;
}

export async function findUserById(userId: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();

	return users.findOne({ _id: new ObjectId(userId) }, { projection: userProjection });
}

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
	avatarUrl?: string;
	emailVerifiedAt?: Date;
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
		avatarUrl: input.avatarUrl,
		emailVerifiedAt: input.emailVerifiedAt,
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
		avatarUrl: input.avatarUrl,
		emailVerifiedAt: input.emailVerifiedAt,
		termsConsent: input.termsConsent,
		createdAt: now,
		updatedAt: now
	};
}

export async function markUserEmailVerified(userId: string): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				emailVerifiedAt: now,
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}

export async function rotateUserPassword(
	userId: string,
	input: {
		newPasswordHash: string;
		currentPasswordHash?: string;
		passwordHistory?: string[];
	}
): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();
	const passwordHistory = buildNextPasswordHistory(
		input.currentPasswordHash,
		input.passwordHistory
	);

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				passwordHash: input.newPasswordHash,
				passwordHistory,
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}

export async function linkGoogleAccount(
	userId: string,
	googleId: string,
	avatarUrl?: string
): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.findOneAndUpdate(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				googleId,
				emailVerifiedAt: now,
				updatedAt: now,
				...(avatarUrl ? { avatarUrl } : {})
			}
		},
		{ returnDocument: 'after', projection: userProjection }
	);

	return result ?? null;
}

export async function updateUserGoogleAvatar(
	userId: string,
	avatarUrl?: string
): Promise<void> {
	if (!avatarUrl) {
		return;
	}

	const users = await getUsersCollection<UserDocument>();

	await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				avatarUrl,
				updatedAt: new Date()
			}
		}
	);
}
