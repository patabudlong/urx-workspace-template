import type {
	WorkspaceSmsMessageDocument,
	WorkspaceSmsMessageDto
} from '$lib/shared/models/workspace-sms-message';
import { WORKSPACE_SMS_MESSAGE_STATUSES } from '$lib/shared/models/workspace-sms-message';
import { getWorkspaceSmsMessagesCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';

let workspaceSmsMessageIndexesPromise: Promise<void> | null = null;

const WORKSPACE_SMS_MESSAGE_PROJECTION = {
	workspaceId: 1,
	sentByUserId: 1,
	to: 1,
	body: 1,
	status: 1,
	providerMessageId: 1,
	error: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toWorkspaceSmsMessageDto(doc: WorkspaceSmsMessageDocument): WorkspaceSmsMessageDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		sentByUserId: doc.sentByUserId.toString(),
		to: doc.to,
		body: doc.body,
		status: doc.status,
		...(doc.providerMessageId ? { providerMessageId: doc.providerMessageId } : {}),
		...(doc.error ? { error: doc.error } : {}),
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

export async function ensureWorkspaceSmsMessageIndexes(): Promise<void> {
	if (!workspaceSmsMessageIndexesPromise) {
		workspaceSmsMessageIndexesPromise = (async () => {
			const collection = await getWorkspaceSmsMessagesCollection();
			await collection.createIndex({ workspaceId: 1, createdAt: -1 });
			await collection.createIndex({ workspaceId: 1, status: 1, createdAt: -1 });
		})();
	}

	await workspaceSmsMessageIndexesPromise;
}

export async function createWorkspaceSmsMessage(input: {
	workspaceId: string;
	sentByUserId: string;
	to: string;
	body: string;
}): Promise<WorkspaceSmsMessageDto> {
	await ensureWorkspaceSmsMessageIndexes();

	const now = new Date();
	const collection = await getWorkspaceSmsMessagesCollection<WorkspaceSmsMessageDocument>();
	const result = await collection.insertOne({
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		sentByUserId: new ObjectId(input.sentByUserId),
		to: input.to,
		body: input.body,
		status: WORKSPACE_SMS_MESSAGE_STATUSES.PENDING,
		createdAt: now,
		updatedAt: now
	});

	const doc = await collection.findOne(
		{ _id: result.insertedId },
		{ projection: WORKSPACE_SMS_MESSAGE_PROJECTION }
	);

	if (!doc) {
		throw new Error('Failed to create SMS message record');
	}

	return toWorkspaceSmsMessageDto(doc);
}

export async function markWorkspaceSmsMessageSent(input: {
	messageId: string;
	providerMessageId: string;
}): Promise<void> {
	const collection = await getWorkspaceSmsMessagesCollection();
	await collection.updateOne(
		{ _id: new ObjectId(input.messageId) },
		{
			$set: {
				status: WORKSPACE_SMS_MESSAGE_STATUSES.SENT,
				providerMessageId: input.providerMessageId,
				updatedAt: new Date()
			},
			$unset: { error: '' }
		}
	);
}

export async function markWorkspaceSmsMessageFailed(input: {
	messageId: string;
	error: string;
}): Promise<void> {
	const collection = await getWorkspaceSmsMessagesCollection();
	await collection.updateOne(
		{ _id: new ObjectId(input.messageId) },
		{
			$set: {
				status: WORKSPACE_SMS_MESSAGE_STATUSES.FAILED,
				error: input.error,
				updatedAt: new Date()
			}
		}
	);
}

export async function listWorkspaceSmsMessages(input: {
	workspaceId: string;
	page: number;
	limit: number;
}): Promise<{ items: WorkspaceSmsMessageDto[]; total: number }> {
	await ensureWorkspaceSmsMessageIndexes();

	const collection = await getWorkspaceSmsMessagesCollection<WorkspaceSmsMessageDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const skip = (input.page - 1) * input.limit;
	const filter = { workspaceId: workspaceObjectId };

	const [items, total] = await Promise.all([
		collection
			.find(filter, { projection: WORKSPACE_SMS_MESSAGE_PROJECTION })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	return {
		items: items.map(toWorkspaceSmsMessageDto),
		total
	};
}

export async function countWorkspaceSmsMessages(workspaceId: string): Promise<number> {
	await ensureWorkspaceSmsMessageIndexes();

	const collection = await getWorkspaceSmsMessagesCollection();
	return collection.countDocuments({ workspaceId: new ObjectId(workspaceId) });
}
