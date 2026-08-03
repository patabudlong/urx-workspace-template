import type { ObjectId } from 'mongodb';
import { ObjectId as MongoObjectId } from 'mongodb';
import { getTwoFactorOtpTokensCollection } from '$lib/server/db/collections';

export const TWO_FACTOR_OTP_PURPOSES = {
	SETUP_SMS: 'setup_sms',
	SETUP_EMAIL: 'setup_email',
	LOGIN_SMS: 'login_sms',
	LOGIN_EMAIL: 'login_email'
} as const;

export type TwoFactorOtpPurpose =
	(typeof TWO_FACTOR_OTP_PURPOSES)[keyof typeof TWO_FACTOR_OTP_PURPOSES];

export type TwoFactorOtpTokenDocument = {
	_id: ObjectId;
	userId: ObjectId;
	purpose: TwoFactorOtpPurpose;
	tokenHash: string;
	expiresAt: Date;
	usedAt?: Date;
	createdAt: Date;
};

let indexesPromise: Promise<void> | null = null;

export async function ensureTwoFactorOtpTokenIndexes(): Promise<void> {
	if (!indexesPromise) {
		indexesPromise = (async () => {
			const tokens = await getTwoFactorOtpTokensCollection<TwoFactorOtpTokenDocument>();
			await tokens.createIndex({ userId: 1, purpose: 1, createdAt: -1 });
			await tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
		})().catch((error) => {
			indexesPromise = null;
			throw error;
		});
	}

	return indexesPromise;
}

export async function createTwoFactorOtpToken(input: {
	userId: string;
	purpose: TwoFactorOtpPurpose;
	tokenHash: string;
	expiresAt: Date;
}): Promise<void> {
	const tokens = await getTwoFactorOtpTokensCollection<TwoFactorOtpTokenDocument>();
	const now = new Date();

	await tokens.insertOne({
		userId: new MongoObjectId(input.userId),
		purpose: input.purpose,
		tokenHash: input.tokenHash,
		expiresAt: input.expiresAt,
		createdAt: now
	} as TwoFactorOtpTokenDocument);
}

export async function findValidTwoFactorOtpToken(input: {
	userId: string;
	purpose: TwoFactorOtpPurpose;
	tokenHash: string;
}): Promise<TwoFactorOtpTokenDocument | null> {
	const tokens = await getTwoFactorOtpTokensCollection<TwoFactorOtpTokenDocument>();
	const now = new Date();

	return tokens.findOne({
		userId: new MongoObjectId(input.userId),
		purpose: input.purpose,
		tokenHash: input.tokenHash,
		expiresAt: { $gt: now },
		usedAt: { $exists: false }
	});
}

export async function markTwoFactorOtpTokenUsed(tokenId: ObjectId): Promise<void> {
	const tokens = await getTwoFactorOtpTokensCollection<TwoFactorOtpTokenDocument>();

	await tokens.updateOne({ _id: tokenId }, { $set: { usedAt: new Date() } });
}
