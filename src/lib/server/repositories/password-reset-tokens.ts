import { getPasswordResetTokensCollection } from '$lib/server/db/collections';
import type { PasswordResetTokenDocument } from '$lib/shared/models/password-reset-token';
import { ObjectId } from 'mongodb';

let indexPromise: Promise<void> | null = null;

export async function ensurePasswordResetTokenIndexes(): Promise<void> {
	if (!indexPromise) {
		indexPromise = (async () => {
			const tokens = await getPasswordResetTokensCollection();
			await tokens.createIndex({ tokenHash: 1 }, { unique: true });
			await tokens.createIndex({ userId: 1, createdAt: -1 });
			await tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
		})().catch((error) => {
			indexPromise = null;
			throw error;
		});
	}

	return indexPromise;
}

export async function invalidatePasswordResetTokensForUser(userId: string): Promise<void> {
	const tokens = await getPasswordResetTokensCollection();
	const now = new Date();

	await tokens.updateMany(
		{
			userId: new ObjectId(userId),
			usedAt: { $exists: false }
		},
		{
			$set: { usedAt: now }
		}
	);
}

export async function createPasswordResetToken(input: {
	userId: string;
	tokenHash: string;
	expiresAt: Date;
}): Promise<PasswordResetTokenDocument> {
	const tokens = await getPasswordResetTokensCollection<PasswordResetTokenDocument>();
	const now = new Date();

	await invalidatePasswordResetTokensForUser(input.userId);

	const result = await tokens.insertOne({
		userId: new ObjectId(input.userId),
		tokenHash: input.tokenHash,
		expiresAt: input.expiresAt,
		createdAt: now
	} as PasswordResetTokenDocument);

	return {
		_id: result.insertedId,
		userId: new ObjectId(input.userId),
		tokenHash: input.tokenHash,
		expiresAt: input.expiresAt,
		createdAt: now
	};
}

export async function findValidPasswordResetToken(
	tokenHash: string
): Promise<PasswordResetTokenDocument | null> {
	const tokens = await getPasswordResetTokensCollection<PasswordResetTokenDocument>();
	const now = new Date();

	return tokens.findOne({
		tokenHash,
		expiresAt: { $gt: now },
		usedAt: { $exists: false }
	});
}

export async function markPasswordResetTokenUsed(tokenId: string): Promise<void> {
	const tokens = await getPasswordResetTokensCollection();
	const now = new Date();

	await tokens.updateOne(
		{ _id: new ObjectId(tokenId) },
		{
			$set: { usedAt: now }
		}
	);
}
