import type {
	ConsentContext,
	ConsentEventDocument,
	ConsentEventType
} from '$lib/shared/models/consent-event';
import { ObjectId } from 'mongodb';
import { getConsentEventsCollection } from '$lib/server/db/collections';

export async function ensureConsentEventIndexes(): Promise<void> {
	const events = await getConsentEventsCollection();
	await events.createIndex({ createdAt: -1 });
	await events.createIndex({ type: 1, createdAt: -1 });
	await events.createIndex({ email: 1, createdAt: -1 }, { sparse: true });
}

export async function recordConsentEvent(input: {
	type: ConsentEventType;
	context: ConsentContext;
	ipAddress: string;
	userAgent?: string;
	email?: string;
	userId?: string;
	policyVersion: string;
}): Promise<ConsentEventDocument> {
	await ensureConsentEventIndexes();

	const events = await getConsentEventsCollection<ConsentEventDocument>();
	const now = new Date();
	const email = input.email?.trim().toLowerCase();

	const result = await events.insertOne({
		type: input.type,
		context: input.context,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		email,
		userId: input.userId ? new ObjectId(input.userId) : undefined,
		policyVersion: input.policyVersion,
		createdAt: now
	} as ConsentEventDocument);

	return {
		_id: result.insertedId,
		type: input.type,
		context: input.context,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		email,
		userId: input.userId ? new ObjectId(input.userId) : undefined,
		policyVersion: input.policyVersion,
		createdAt: now
	};
}
