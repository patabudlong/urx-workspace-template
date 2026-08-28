import { createHash, randomBytes } from 'node:crypto';
import { getPmClientInvitationsCollection } from '$lib/server/db/collections';
import type {
	PmClientInvitationDocument,
	PmClientInvitationDto
} from '$lib/shared/models/pm-client-invitation';
import { PM_CLIENT_INVITATION_STATUSES } from '$lib/shared/models/pm-client-invitation';
import { ObjectId } from 'mongodb';

const TOKEN_BYTES = 16;

let pmClientInvitationIndexesPromise: Promise<void> | null = null;

const TERMINAL_INVITATION_STATUSES = [
	PM_CLIENT_INVITATION_STATUSES.COMPLETED,
	PM_CLIENT_INVITATION_STATUSES.REVOKED,
	PM_CLIENT_INVITATION_STATUSES.EXPIRED
] as const;

const invitationProjection = {
	_id: 1,
	workspaceId: 1,
	projectId: 1,
	clientEmail: 1,
	clientName: 1,
	tokenHash: 1,
	invitedByUserId: 1,
	status: 1,
	expiresAt: 1,
	completedAt: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function openInvitationFilter(now = new Date()) {
	return {
		status: PM_CLIENT_INVITATION_STATUSES.PENDING,
		expiresAt: { $gt: now }
	};
}

function toPmClientInvitationDto(doc: PmClientInvitationDocument): PmClientInvitationDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		projectId: doc.projectId.toString(),
		clientEmail: doc.clientEmail,
		clientName: doc.clientName,
		status: doc.status,
		expiresAt: doc.expiresAt.toISOString(),
		completedAt: doc.completedAt?.toISOString() ?? null,
		createdAt: doc.createdAt.toISOString()
	};
}

export function hashPmClientInvitationToken(token: string): string {
	return createHash('sha256').update(token.trim()).digest('hex');
}

export function createPmClientInvitationToken(): string {
	return randomBytes(TOKEN_BYTES).toString('base64url');
}

export async function ensurePmClientInvitationIndexes(): Promise<void> {
	if (!pmClientInvitationIndexesPromise) {
		pmClientInvitationIndexesPromise = (async () => {
			const collection = await getPmClientInvitationsCollection();
			await collection.createIndex({ tokenHash: 1 }, { unique: true });
			await collection.createIndex({ workspaceId: 1, projectId: 1, createdAt: -1 });
			await collection.createIndex({ projectId: 1, clientEmail: 1, status: 1 });
		})();
	}

	await pmClientInvitationIndexesPromise;
}

export async function listPmClientInvitationsForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<PmClientInvitationDto[]> {
	await ensurePmClientInvitationIndexes();

	const collection = await getPmClientInvitationsCollection<PmClientInvitationDocument>();
	const docs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				projectId: new ObjectId(input.projectId)
			},
			{ projection: invitationProjection }
		)
		.sort({ createdAt: -1 })
		.limit(20)
		.toArray();

	return docs.map(toPmClientInvitationDto);
}

export async function findOpenPmClientInvitationForProject(input: {
	workspaceId: string;
	projectId: string;
	clientEmail: string;
}): Promise<PmClientInvitationDocument | null> {
	await ensurePmClientInvitationIndexes();

	const collection = await getPmClientInvitationsCollection<PmClientInvitationDocument>();
	return collection.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			projectId: new ObjectId(input.projectId),
			clientEmail: input.clientEmail.trim().toLowerCase(),
			...openInvitationFilter()
		},
		{ projection: invitationProjection }
	);
}

export async function findPmClientInvitationByTokenHash(
	tokenHash: string
): Promise<PmClientInvitationDocument | null> {
	await ensurePmClientInvitationIndexes();

	const collection = await getPmClientInvitationsCollection<PmClientInvitationDocument>();
	return collection.findOne({ tokenHash }, { projection: invitationProjection });
}

export async function createPmClientInvitation(input: {
	workspaceId: string;
	projectId: string;
	clientEmail: string;
	clientName: string | null;
	tokenHash: string;
	invitedByUserId: string;
	expiresAt: Date;
}): Promise<PmClientInvitationDocument> {
	await ensurePmClientInvitationIndexes();

	const now = new Date();
	const collection = await getPmClientInvitationsCollection<PmClientInvitationDocument>();

	await collection.updateMany(
		{
			workspaceId: new ObjectId(input.workspaceId),
			projectId: new ObjectId(input.projectId),
			clientEmail: input.clientEmail.trim().toLowerCase(),
			...openInvitationFilter(now)
		},
		{
			$set: {
				status: PM_CLIENT_INVITATION_STATUSES.REVOKED,
				updatedAt: now
			}
		}
	);

	const doc: PmClientInvitationDocument = {
		_id: new ObjectId(),
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId),
		clientEmail: input.clientEmail.trim().toLowerCase(),
		clientName: input.clientName,
		tokenHash: input.tokenHash,
		invitedByUserId: new ObjectId(input.invitedByUserId),
		status: PM_CLIENT_INVITATION_STATUSES.PENDING,
		expiresAt: input.expiresAt,
		createdAt: now,
		updatedAt: now
	};

	await collection.insertOne(doc);
	return doc;
}

export async function markPmClientInvitationCompleted(
	invitationId: string
): Promise<PmClientInvitationDocument | null> {
	await ensurePmClientInvitationIndexes();

	const collection = await getPmClientInvitationsCollection<PmClientInvitationDocument>();
	const now = new Date();

	const result = await collection.findOneAndUpdate(
		{ _id: new ObjectId(invitationId) },
		{
			$set: {
				status: PM_CLIENT_INVITATION_STATUSES.COMPLETED,
				completedAt: now,
				updatedAt: now
			}
		},
		{ returnDocument: 'after', projection: invitationProjection }
	);

	return result ?? null;
}

export async function deletePmClientInvitationsForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<number> {
	await ensurePmClientInvitationIndexes();

	const collection = await getPmClientInvitationsCollection();
	const result = await collection.deleteMany({
		workspaceId: new ObjectId(input.workspaceId),
		projectId: new ObjectId(input.projectId)
	});

	return result.deletedCount;
}
