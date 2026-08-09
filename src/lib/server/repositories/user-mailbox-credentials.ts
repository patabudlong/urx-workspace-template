import { getUserMailboxCredentialsCollection } from '$lib/server/db/collections';
import { decryptMailboxPassword, encryptMailboxPassword } from '$lib/server/mailbox/credentials';
import type { MailboxConfig } from '$lib/server/mailbox/config';
import type {
	UserMailboxCredentialsDocument,
	UserMailboxCredentialsStatus
} from '$lib/shared/models/user-mailbox-credentials';
import type { MailboxSignature } from '$lib/shared/mailbox/signature';
import { EMPTY_MAILBOX_SIGNATURE, normalizeMailboxSignature } from '$lib/shared/mailbox/signature';
import { ObjectId } from 'mongodb';

const statusProjection = {
	email: 1,
	displayName: 1,
	connectedAt: 1,
	lastVerifiedAt: 1
} as const;

const signatureProjection = {
	signature: 1
} as const;

function mapMailboxSignature(
	record: Pick<UserMailboxCredentialsDocument, 'signature'> | null
): MailboxSignature | null {
	if (!record?.signature) {
		return null;
	}

	const { updatedAt: _updatedAt, ...signature } = record.signature;
	return normalizeMailboxSignature(signature);
}

let indexPromise: Promise<void> | null = null;

export async function ensureUserMailboxCredentialIndexes(): Promise<void> {
	if (!indexPromise) {
		indexPromise = (async () => {
			const collection = await getUserMailboxCredentialsCollection();
			await collection.createIndex({ userId: 1 }, { unique: true });
			await collection.createIndex({ email: 1 });
		})().catch((error) => {
			indexPromise = null;
			throw error;
		});
	}

	return indexPromise;
}

export async function getMailboxConnectionStatus(
	userId: string
): Promise<UserMailboxCredentialsStatus> {
	await ensureUserMailboxCredentialIndexes();
	const collection =
		await getUserMailboxCredentialsCollection<Pick<UserMailboxCredentialsDocument, keyof typeof statusProjection>>();
	const record = await collection.findOne(
		{ userId: new ObjectId(userId) },
		{ projection: statusProjection }
	);

	if (!record) {
		return { connected: false };
	}

	return {
		connected: true,
		email: record.email,
		displayName: record.displayName,
		connectedAt: record.connectedAt.toISOString(),
		lastVerifiedAt: record.lastVerifiedAt?.toISOString()
	};
}

export async function getMailboxConfigForUser(userId: string): Promise<MailboxConfig | null> {
	await ensureUserMailboxCredentialIndexes();
	const collection =
		await getUserMailboxCredentialsCollection<UserMailboxCredentialsDocument>();
	const record = await collection.findOne({ userId: new ObjectId(userId) });

	if (!record) {
		return null;
	}

	return {
		imap: record.imap,
		smtp: record.smtp,
		email: record.email,
		password: decryptMailboxPassword(record.passwordEncrypted),
		displayName: record.displayName
	};
}

export async function upsertMailboxCredentialsForUser(
	userId: string,
	config: MailboxConfig
): Promise<UserMailboxCredentialsStatus> {
	await ensureUserMailboxCredentialIndexes();
	const collection =
		await getUserMailboxCredentialsCollection<UserMailboxCredentialsDocument>();
	const now = new Date();
	const userObjectId = new ObjectId(userId);

	await collection.updateOne(
		{ userId: userObjectId },
		{
			$set: {
				email: config.email,
				passwordEncrypted: encryptMailboxPassword(config.password),
				displayName: config.displayName,
				imap: config.imap,
				smtp: config.smtp,
				lastVerifiedAt: now,
				updatedAt: now
			},
			$setOnInsert: {
				userId: userObjectId,
				connectedAt: now
			}
		},
		{ upsert: true }
	);

	return getMailboxConnectionStatus(userId);
}

export async function getMailboxSignature(userId: string): Promise<MailboxSignature | null> {
	await ensureUserMailboxCredentialIndexes();
	const collection =
		await getUserMailboxCredentialsCollection<
			Pick<UserMailboxCredentialsDocument, keyof typeof signatureProjection>
		>();
	const record = await collection.findOne(
		{ userId: new ObjectId(userId) },
		{ projection: signatureProjection }
	);

	return mapMailboxSignature(record);
}

export async function upsertMailboxSignature(
	userId: string,
	signature: MailboxSignature
): Promise<MailboxSignature> {
	await ensureUserMailboxCredentialIndexes();
	const collection =
		await getUserMailboxCredentialsCollection<UserMailboxCredentialsDocument>();
	const now = new Date();
	const result = await collection.updateOne(
		{ userId: new ObjectId(userId) },
		{
			$set: {
				signature: {
					...EMPTY_MAILBOX_SIGNATURE,
					...signature,
					updatedAt: now
				},
				updatedAt: now
			}
		}
	);

	if (result.matchedCount === 0) {
		throw new Error('Mailbox is not connected');
	}

	return signature;
}

export async function deleteMailboxCredentialsForUser(userId: string): Promise<void> {
	await ensureUserMailboxCredentialIndexes();
	const collection = await getUserMailboxCredentialsCollection();
	await collection.deleteOne({ userId: new ObjectId(userId) });
}

export async function touchMailboxCredentialsVerifiedAt(userId: string): Promise<void> {
	await ensureUserMailboxCredentialIndexes();
	const collection = await getUserMailboxCredentialsCollection();
	const now = new Date();

	await collection.updateOne(
		{ userId: new ObjectId(userId) },
		{
			$set: {
				lastVerifiedAt: now,
				updatedAt: now
			}
		}
	);
}
