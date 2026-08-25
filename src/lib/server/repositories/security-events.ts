import { ObjectId } from 'mongodb';
import { getSecurityEventsCollection } from '$lib/server/db/collections';
import type {
	SecurityEventAction,
	SecurityEventCategory,
	SecurityEventDocument,
	SecurityEventScope,
	SecurityEventSeverity,
	SecurityEventSummary
} from '$lib/shared/models/security-event';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;
const LOGIN_HISTORY_DAYS = 30;
const LOGIN_HISTORY_LIMIT = 10;

const securityEventProjection = {
	scope: 1,
	category: 1,
	action: 1,
	severity: 1,
	actorUserId: 1,
	userId: 1,
	workspaceId: 1,
	targetUserId: 1,
	ipAddress: 1,
	userAgent: 1,
	isUnusualLocation: 1,
	metadata: 1,
	createdAt: 1
} as const;

let indexPromise: Promise<void> | null = null;

export async function ensureSecurityEventIndexes(): Promise<void> {
	if (!indexPromise) {
		indexPromise = (async () => {
			const events = await getSecurityEventsCollection();
			await events.createIndex({ userId: 1, createdAt: -1 }, { sparse: true });
			await events.createIndex({ workspaceId: 1, createdAt: -1 }, { sparse: true });
			await events.createIndex({ actorUserId: 1, createdAt: -1 }, { sparse: true });
			await events.createIndex({ action: 1, createdAt: -1 });
			await events.createIndex({ category: 1, createdAt: -1 });
			await events.createIndex({ isUnusualLocation: 1, createdAt: -1 }, { sparse: true });
		})().catch((error) => {
			indexPromise = null;
			throw error;
		});
	}

	await indexPromise;
}

function toSummary(document: SecurityEventDocument): SecurityEventSummary {
	return {
		id: document._id.toString(),
		scope: document.scope,
		category: document.category,
		action: document.action,
		severity: document.severity,
		actorUserId: document.actorUserId?.toString() ?? null,
		userId: document.userId?.toString() ?? null,
		workspaceId: document.workspaceId?.toString() ?? null,
		targetUserId: document.targetUserId?.toString() ?? null,
		ipAddress: document.ipAddress ?? null,
		userAgent: document.userAgent ?? null,
		isUnusualLocation: Boolean(document.isUnusualLocation),
		metadata: document.metadata ?? {},
		createdAt: document.createdAt.toISOString()
	};
}

export async function insertSecurityEvent(input: {
	scope: SecurityEventScope;
	category: SecurityEventCategory;
	action: SecurityEventAction;
	severity: SecurityEventSeverity;
	actorUserId?: string;
	userId?: string;
	workspaceId?: string;
	targetUserId?: string;
	ipAddress?: string;
	userAgent?: string;
	isUnusualLocation?: boolean;
	metadata?: Record<string, unknown>;
}): Promise<SecurityEventSummary> {
	await ensureSecurityEventIndexes();

	const events = await getSecurityEventsCollection<SecurityEventDocument>();
	const now = new Date();

	const document: SecurityEventDocument = {
		_id: new ObjectId(),
		scope: input.scope,
		category: input.category,
		action: input.action,
		severity: input.severity,
		actorUserId: input.actorUserId ? new ObjectId(input.actorUserId) : undefined,
		userId: input.userId ? new ObjectId(input.userId) : undefined,
		workspaceId: input.workspaceId ? new ObjectId(input.workspaceId) : undefined,
		targetUserId: input.targetUserId ? new ObjectId(input.targetUserId) : undefined,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		isUnusualLocation: input.isUnusualLocation,
		metadata: input.metadata,
		createdAt: now
	};

	await events.insertOne(document);

	return toSummary(document);
}

export async function listAccountSecurityEvents(input: {
	userId: string;
	page?: number;
	limit?: number;
	category?: SecurityEventCategory;
	unusualOnly?: boolean;
}): Promise<{ items: SecurityEventSummary[]; total: number }> {
	await ensureSecurityEventIndexes();

	const page = Math.max(1, input.page ?? 1);
	const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIST_LIMIT));
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = {
		userId: new ObjectId(input.userId)
	};

	if (input.category) {
		filter.category = input.category;
	}

	if (input.unusualOnly) {
		filter.isUnusualLocation = true;
	}

	const events = await getSecurityEventsCollection<SecurityEventDocument>();

	const [documents, total] = await Promise.all([
		events
			.find(filter, { projection: securityEventProjection })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.toArray(),
		events.countDocuments(filter)
	]);

	return {
		items: documents.map(toSummary),
		total
	};
}

export async function listWorkspaceSecurityEvents(input: {
	workspaceId: string;
	page?: number;
	limit?: number;
	category?: SecurityEventCategory;
	unusualOnly?: boolean;
}): Promise<{ items: SecurityEventSummary[]; total: number }> {
	await ensureSecurityEventIndexes();

	const page = Math.max(1, input.page ?? 1);
	const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIST_LIMIT));
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = {
		workspaceId: new ObjectId(input.workspaceId)
	};

	if (input.category) {
		filter.category = input.category;
	}

	if (input.unusualOnly) {
		filter.isUnusualLocation = true;
	}

	const events = await getSecurityEventsCollection<SecurityEventDocument>();

	const [documents, total] = await Promise.all([
		events
			.find(filter, { projection: securityEventProjection })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.toArray(),
		events.countDocuments(filter)
	]);

	return {
		items: documents.map(toSummary),
		total
	};
}

export async function listRecentLoginNetworksForUser(userId: string): Promise<string[]> {
	await ensureSecurityEventIndexes();

	const since = new Date(Date.now() - LOGIN_HISTORY_DAYS * 24 * 60 * 60 * 1000);
	const events = await getSecurityEventsCollection<SecurityEventDocument>();

	const documents = await events
		.find(
			{
				userId: new ObjectId(userId),
				action: {
					$in: [
						SECURITY_EVENT_ACTIONS.LOGIN_SUCCESS,
						SECURITY_EVENT_ACTIONS.TWO_FACTOR_SUCCESS
					]
				},
				ipAddress: { $exists: true, $ne: '' },
				createdAt: { $gte: since }
			},
			{ projection: { ipAddress: 1 } }
		)
		.sort({ createdAt: -1 })
		.limit(LOGIN_HISTORY_LIMIT)
		.toArray();

	return documents
		.map((document) => document.ipAddress)
		.filter((value): value is string => Boolean(value));
}
