import { randomBytes, randomUUID } from 'node:crypto';
import { encryptSecret } from '$lib/server/crypto/secret-encryption';
import { getWorkspaceModuleIntegrationCredentialsCollection } from '$lib/server/db/collections';
import type {
	WorkspaceModuleIntegrationCredentialsDocument,
	WorkspaceModuleIntegrationCredentialsGenerateResult,
	WorkspaceModuleIntegrationCredentialsStatus
} from '$lib/shared/models/workspace-module-integration-credentials';
import { getDefaultAuthBaseUriForPackage } from '$lib/shared/workspace-module-integrations';
import type { WorkspacePackageId } from '$lib/shared/workspace-packages';
import { ObjectId } from 'mongodb';

const statusProjection = {
	packageId: 1,
	clientId: 1,
	authBaseUri: 1,
	clientSecretEncrypted: 1,
	updatedAt: 1
} as const;

let indexPromise: Promise<void> | null = null;

async function ensureWorkspaceModuleIntegrationCredentialIndexes(): Promise<void> {
	if (!indexPromise) {
		indexPromise = (async () => {
			const collection = await getWorkspaceModuleIntegrationCredentialsCollection();
			await collection.createIndex({ workspaceId: 1, packageId: 1 }, { unique: true });
			await collection.createIndex({ clientId: 1 }, { unique: true });
		})().catch((error) => {
			indexPromise = null;
			throw error;
		});
	}

	return indexPromise;
}

function toStatus(
	record: Pick<
		WorkspaceModuleIntegrationCredentialsDocument,
		keyof typeof statusProjection
	> | null,
	packageId: WorkspacePackageId
): WorkspaceModuleIntegrationCredentialsStatus {
	if (!record) {
		return {
			packageId,
			configured: false
		};
	}

	return {
		packageId: record.packageId,
		configured: true,
		clientId: record.clientId,
		authBaseUri: record.authBaseUri,
		hasClientSecret: Boolean(record.clientSecretEncrypted),
		updatedAt: record.updatedAt.toISOString()
	};
}

export async function getWorkspaceModuleIntegrationCredentialsStatus(input: {
	workspaceId: string;
	packageId: WorkspacePackageId;
}): Promise<WorkspaceModuleIntegrationCredentialsStatus> {
	await ensureWorkspaceModuleIntegrationCredentialIndexes();
	const collection =
		await getWorkspaceModuleIntegrationCredentialsCollection<
			Pick<WorkspaceModuleIntegrationCredentialsDocument, keyof typeof statusProjection>
		>();
	const record = await collection.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			packageId: input.packageId
		},
		{ projection: statusProjection }
	);

	return toStatus(record, input.packageId);
}

export async function generateWorkspaceModuleIntegrationCredentials(input: {
	workspaceId: string;
	packageId: WorkspacePackageId;
}): Promise<WorkspaceModuleIntegrationCredentialsGenerateResult> {
	await ensureWorkspaceModuleIntegrationCredentialIndexes();
	const collection =
		await getWorkspaceModuleIntegrationCredentialsCollection<WorkspaceModuleIntegrationCredentialsDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const now = new Date();
	const existing = await collection.findOne(
		{
			workspaceId: workspaceObjectId,
			packageId: input.packageId
		},
		{ projection: statusProjection }
	);

	const clientId = randomUUID();
	const clientSecret = randomBytes(32).toString('base64url');
	const authBaseUri =
		existing?.authBaseUri ?? getDefaultAuthBaseUriForPackage(input.packageId);

	await collection.updateOne(
		{
			workspaceId: workspaceObjectId,
			packageId: input.packageId
		},
		{
			$set: {
				clientId,
				clientSecretEncrypted: encryptSecret(clientSecret),
				authBaseUri,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				packageId: input.packageId,
				createdAt: now
			}
		},
		{ upsert: true }
	);

	const status = await getWorkspaceModuleIntegrationCredentialsStatus(input);

	return {
		...status,
		clientSecret
	};
}

export async function updateWorkspaceModuleIntegrationAuthBaseUri(input: {
	workspaceId: string;
	packageId: WorkspacePackageId;
	authBaseUri: string;
}): Promise<WorkspaceModuleIntegrationCredentialsStatus> {
	await ensureWorkspaceModuleIntegrationCredentialIndexes();
	const collection =
		await getWorkspaceModuleIntegrationCredentialsCollection<WorkspaceModuleIntegrationCredentialsDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const now = new Date();
	const existing = await collection.findOne(
		{
			workspaceId: workspaceObjectId,
			packageId: input.packageId
		},
		{ projection: { _id: 1 } }
	);

	if (!existing) {
		throw new Error('CREDENTIALS_NOT_CONFIGURED');
	}

	await collection.updateOne(
		{
			workspaceId: workspaceObjectId,
			packageId: input.packageId
		},
		{
			$set: {
				authBaseUri: input.authBaseUri,
				updatedAt: now
			}
		}
	);

	return getWorkspaceModuleIntegrationCredentialsStatus(input);
}
