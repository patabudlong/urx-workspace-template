import { getEmailVerificationTokensCollection } from '$lib/server/db/collections';
import type { EmailVerificationTokenDocument } from '$lib/shared/models/email-verification-token';
import { ObjectId } from 'mongodb';

let indexPromise: Promise<void> | null = null;

export async function ensureEmailVerificationTokenIndexes(): Promise<void> {
	if (!indexPromise) {
		indexPromise = (async () => {
			const tokens = await getEmailVerificationTokensCollection();
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

export async function invalidateEmailVerificationTokensForUser(userId: string): Promise<void> {
	const tokens = await getEmailVerificationTokensCollection();
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

export async function createEmailVerificationToken(input: {
	userId: string;
	tokenHash: string;
	expiresAt: Date;
}): Promise<EmailVerificationTokenDocument> {
	const tokens = await getEmailVerificationTokensCollection<EmailVerificationTokenDocument>();
	const now = new Date();

	await invalidateEmailVerificationTokensForUser(input.userId);

	const result = await tokens.insertOne({
		userId: new ObjectId(input.userId),
		tokenHash: input.tokenHash,
		expiresAt: input.expiresAt,
		createdAt: now
	} as EmailVerificationTokenDocument);

	return {
		_id: result.insertedId,
		userId: new ObjectId(input.userId),
		tokenHash: input.tokenHash,
		expiresAt: input.expiresAt,
		createdAt: now
	};
}

export async function findValidEmailVerificationToken(
	tokenHash: string
): Promise<EmailVerificationTokenDocument | null> {
	const tokens = await getEmailVerificationTokensCollection<EmailVerificationTokenDocument>();
	const now = new Date();

	return tokens.findOne({
		tokenHash,
		expiresAt: { $gt: now },
		usedAt: { $exists: false }
	});
}

export async function findValidEmailVerificationTokenForUser(
	userId: string,
	tokenHash: string
): Promise<EmailVerificationTokenDocument | null> {
	const tokens = await getEmailVerificationTokensCollection<EmailVerificationTokenDocument>();
	const now = new Date();

	return tokens.findOne({
		userId: new ObjectId(userId),
		tokenHash,
		expiresAt: { $gt: now },
		usedAt: { $exists: false }
	});
}

export async function markEmailVerificationTokenUsed(tokenId: string): Promise<void> {
	const tokens = await getEmailVerificationTokensCollection();
	const now = new Date();

	await tokens.updateOne(
		{ _id: new ObjectId(tokenId) },
		{
			$set: { usedAt: now }
		}
	);
}
