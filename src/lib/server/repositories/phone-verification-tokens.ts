import { getPhoneVerificationTokensCollection } from '$lib/server/db/collections';
import type { PhoneVerificationTokenDocument } from '$lib/shared/models/phone-verification-token';
import { ObjectId } from 'mongodb';

let indexPromise: Promise<void> | null = null;

export async function ensurePhoneVerificationTokenIndexes(): Promise<void> {
	if (!indexPromise) {
		indexPromise = (async () => {
			const tokens = await getPhoneVerificationTokensCollection();
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

export async function invalidatePhoneVerificationTokensForUser(userId: string): Promise<void> {
	const tokens = await getPhoneVerificationTokensCollection();
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

export async function createPhoneVerificationToken(input: {
	userId: string;
	phoneNumber: string;
	tokenHash: string;
	expiresAt: Date;
}): Promise<PhoneVerificationTokenDocument> {
	const tokens = await getPhoneVerificationTokensCollection<PhoneVerificationTokenDocument>();
	const now = new Date();

	await invalidatePhoneVerificationTokensForUser(input.userId);

	const result = await tokens.insertOne({
		userId: new ObjectId(input.userId),
		phoneNumber: input.phoneNumber,
		tokenHash: input.tokenHash,
		expiresAt: input.expiresAt,
		createdAt: now
	} as PhoneVerificationTokenDocument);

	return {
		_id: result.insertedId,
		userId: new ObjectId(input.userId),
		phoneNumber: input.phoneNumber,
		tokenHash: input.tokenHash,
		expiresAt: input.expiresAt,
		createdAt: now
	};
}

export async function findValidPhoneVerificationTokenForUser(
	userId: string,
	phoneNumber: string,
	tokenHash: string
): Promise<PhoneVerificationTokenDocument | null> {
	const tokens = await getPhoneVerificationTokensCollection<PhoneVerificationTokenDocument>();
	const now = new Date();

	return tokens.findOne({
		userId: new ObjectId(userId),
		phoneNumber,
		tokenHash,
		expiresAt: { $gt: now },
		usedAt: { $exists: false }
	});
}

export async function markPhoneVerificationTokenUsed(tokenId: string): Promise<void> {
	const tokens = await getPhoneVerificationTokensCollection();
	const now = new Date();

	await tokens.updateOne(
		{ _id: new ObjectId(tokenId) },
		{
			$set: { usedAt: now }
		}
	);
}
