import type { ObjectId } from 'mongodb';
import type { WorkspacePackageId } from '$lib/shared/workspace-packages';

export type WorkspaceModuleIntegrationCredentialsDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	packageId: WorkspacePackageId;
	clientId: string;
	clientSecretEncrypted: string;
	authBaseUri: string;
	createdAt: Date;
	updatedAt: Date;
};

export type WorkspaceModuleIntegrationCredentialsStatus = {
	packageId: WorkspacePackageId;
	configured: boolean;
	clientId?: string;
	authBaseUri?: string;
	hasClientSecret?: boolean;
	updatedAt?: string;
};

export type WorkspaceModuleIntegrationCredentialsGenerateResult =
	WorkspaceModuleIntegrationCredentialsStatus & {
		clientSecret?: string;
	};
