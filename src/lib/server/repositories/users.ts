import type { UserDocument, TermsConsent } from '$lib/shared/models/user';
import type { PresenceStatus } from '$lib/shared/presence';
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
			await users.createIndex({ phoneNumber: 1 }, { unique: true, sparse: true });
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
	phoneNumber: 1,
	phoneVerifiedAt: 1,
	emailVerifiedAt: 1,
	termsConsent: 1,
	platformRole: 1,
	presenceStatus: 1,
	lastSeenAt: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

export function isUserEmailVerified(user: UserDocument): boolean {
	return user.emailVerifiedAt != null;
}

export function isUserPhoneVerified(user: UserDocument): boolean {
	return user.phoneNumber != null && user.phoneVerifiedAt != null;
}

export async function findUserById(userId: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();

	return users.findOne({ _id: new ObjectId(userId) }, { projection: userProjection });
}

export async function findUsersByIds(userIds: string[]): Promise<UserDocument[]> {
	if (userIds.length === 0) {
		return [];
	}

	const users = await getUsersCollection<UserDocument>();

	return users
		.find(
			{ _id: { $in: userIds.map((userId) => new ObjectId(userId)) } },
			{ projection: userProjection }
		)
		.toArray();
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();

	return users.findOne({ email: email.trim().toLowerCase() }, { projection: userProjection });
}

export async function findUserByGoogleId(googleId: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();

	return users.findOne({ googleId }, { projection: userProjection });
}

export async function findUserByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();

	return users.findOne({ phoneNumber }, { projection: userProjection });
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
		...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
		...(input.googleId ? { googleId: input.googleId } : {}),
		firstName,
		lastName,
		...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
		...(input.emailVerifiedAt ? { emailVerifiedAt: input.emailVerifiedAt } : {}),
		...(input.termsConsent ? { termsConsent: input.termsConsent } : {}),
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

export async function updateUserProfile(
	userId: string,
	input: { firstName: string; lastName: string }
): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();
	const firstName = input.firstName.trim();
	const lastName = input.lastName.trim();

	const result = await users.findOneAndUpdate(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				firstName,
				lastName,
				updatedAt: now
			}
		},
		{ returnDocument: 'after', projection: userProjection }
	);

	return result ?? null;
}

export async function updateUserPhoneNumber(
	userId: string,
	phoneNumber: string | null
): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	if (!phoneNumber) {
		const result = await users.findOneAndUpdate(
			{ _id: new ObjectId(userId) },
			{
				$set: { updatedAt: now },
				$unset: { phoneNumber: '', phoneVerifiedAt: '' }
			},
			{ returnDocument: 'after', projection: userProjection }
		);

		return result ?? null;
	}

	const result = await users.findOneAndUpdate(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				phoneNumber,
				updatedAt: now
			},
			$unset: { phoneVerifiedAt: '' }
		},
		{ returnDocument: 'after', projection: userProjection }
	);

	return result ?? null;
}

export async function markUserPhoneVerified(userId: string): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId), phoneNumber: { $exists: true, $ne: '' } },
		{
			$set: {
				phoneVerifiedAt: now,
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
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

export async function updateUserPresenceStatus(
	userId: string,
	status: PresenceStatus
): Promise<UserDocument | null> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const update =
		status === 'offline'
			? {
					$set: {
						presenceStatus: status,
						updatedAt: now
					},
					$unset: { lastSeenAt: '' as const }
				}
			: {
					$set: {
						presenceStatus: status,
						lastSeenAt: now,
						updatedAt: now
					}
				};

	const result = await users.findOneAndUpdate(
		{ _id: new ObjectId(userId) },
		update,
		{ returnDocument: 'after', projection: userProjection }
	);

	return result ?? null;
}

export async function touchUserPresence(userId: string): Promise<UserDocument | null> {
	const user = await findUserById(userId);

	if (!user || user.presenceStatus === 'offline') {
		return user;
	}

	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.findOneAndUpdate(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				presenceStatus: user.presenceStatus ?? 'online',
				lastSeenAt: now,
				updatedAt: now
			}
		},
		{ returnDocument: 'after', projection: userProjection }
	);

	return result ?? null;
}
