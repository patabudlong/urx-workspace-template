import { ObjectId } from 'mongodb';
import { getNotificationsCollection } from '$lib/server/db/collections';
import type {
	NotificationAction,
	NotificationCategory,
	NotificationDocument,
	NotificationSeverity,
	NotificationSummary
} from '$lib/shared/models/notification';

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;

const notificationProjection = {
	recipientUserId: 1,
	workspaceId: 1,
	category: 1,
	action: 1,
	severity: 1,
	title: 1,
	body: 1,
	href: 1,
	metadata: 1,
	readAt: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

let indexPromise: Promise<void> | null = null;

export async function ensureNotificationIndexes(): Promise<void> {
	if (!indexPromise) {
		indexPromise = (async () => {
			const notifications = await getNotificationsCollection();
			await notifications.createIndex({ recipientUserId: 1, createdAt: -1 });
			await notifications.createIndex(
				{ recipientUserId: 1, readAt: 1, createdAt: -1 },
				{ sparse: true }
			);
			await notifications.createIndex({ workspaceId: 1, createdAt: -1 }, { sparse: true });
		})().catch((error) => {
			indexPromise = null;
			throw error;
		});
	}

	await indexPromise;
}

function toSummary(document: NotificationDocument): NotificationSummary {
	return {
		id: document._id.toString(),
		workspaceId: document.workspaceId?.toString() ?? null,
		category: document.category,
		action: document.action,
		severity: document.severity,
		title: document.title,
		body: document.body ?? null,
		href: document.href ?? null,
		metadata: document.metadata ?? {},
		isRead: Boolean(document.readAt),
		readAt: document.readAt?.toISOString() ?? null,
		createdAt: document.createdAt.toISOString()
	};
}

export async function insertNotification(input: {
	recipientUserId: string;
	workspaceId?: string;
	category: NotificationCategory;
	action: NotificationAction;
	severity?: NotificationSeverity;
	title: string;
	body?: string;
	href?: string;
	metadata?: Record<string, unknown>;
}): Promise<NotificationSummary> {
	await ensureNotificationIndexes();

	const notifications = await getNotificationsCollection<NotificationDocument>();
	const now = new Date();

	const document: NotificationDocument = {
		_id: new ObjectId(),
		recipientUserId: new ObjectId(input.recipientUserId),
		workspaceId: input.workspaceId ? new ObjectId(input.workspaceId) : undefined,
		category: input.category,
		action: input.action,
		severity: input.severity ?? 'info',
		title: input.title,
		body: input.body,
		href: input.href,
		metadata: input.metadata,
		createdAt: now,
		updatedAt: now
	};

	await notifications.insertOne(document);

	return toSummary(document);
}

export async function listNotificationsForUser(input: {
	userId: string;
	page?: number;
	limit?: number;
	unreadOnly?: boolean;
	category?: NotificationCategory;
	workspaceId?: string;
}): Promise<{ items: NotificationSummary[]; total: number }> {
	await ensureNotificationIndexes();

	const page = Math.max(1, input.page ?? 1);
	const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIST_LIMIT));
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = {
		recipientUserId: new ObjectId(input.userId)
	};

	if (input.unreadOnly) {
		filter.readAt = { $exists: false };
	}

	if (input.category) {
		filter.category = input.category;
	}

	if (input.workspaceId) {
		filter.workspaceId = new ObjectId(input.workspaceId);
	}

	const notifications = await getNotificationsCollection<NotificationDocument>();

	const [documents, total] = await Promise.all([
		notifications
			.find(filter, { projection: notificationProjection })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.toArray(),
		notifications.countDocuments(filter)
	]);

	return {
		items: documents.map(toSummary),
		total
	};
}

export async function countUnreadNotificationsForUser(input: {
	userId: string;
	workspaceId?: string;
}): Promise<number> {
	await ensureNotificationIndexes();

	const filter: Record<string, unknown> = {
		recipientUserId: new ObjectId(input.userId),
		readAt: { $exists: false }
	};

	if (input.workspaceId) {
		filter.workspaceId = new ObjectId(input.workspaceId);
	}

	const notifications = await getNotificationsCollection<NotificationDocument>();

	return notifications.countDocuments(filter);
}

export async function markNotificationRead(input: {
	notificationId: string;
	userId: string;
}): Promise<NotificationSummary | null> {
	await ensureNotificationIndexes();

	const notifications = await getNotificationsCollection<NotificationDocument>();
	const now = new Date();

	const result = await notifications.findOneAndUpdate(
		{
			_id: new ObjectId(input.notificationId),
			recipientUserId: new ObjectId(input.userId)
		},
		{
			$set: {
				readAt: now,
				updatedAt: now
			}
		},
		{
			projection: notificationProjection,
			returnDocument: 'after'
		}
	);

	if (!result) {
		return null;
	}

	return toSummary(result);
}

export async function markAllNotificationsRead(input: {
	userId: string;
	workspaceId?: string;
}): Promise<number> {
	await ensureNotificationIndexes();

	const filter: Record<string, unknown> = {
		recipientUserId: new ObjectId(input.userId),
		readAt: { $exists: false }
	};

	if (input.workspaceId) {
		filter.workspaceId = new ObjectId(input.workspaceId);
	}

	const notifications = await getNotificationsCollection<NotificationDocument>();
	const now = new Date();

	const result = await notifications.updateMany(filter, {
		$set: {
			readAt: now,
			updatedAt: now
		}
	});

	return result.modifiedCount;
}
