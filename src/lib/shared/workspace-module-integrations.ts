import { z } from 'zod';
import { WORKSPACE_PACKAGE_IDS, type WorkspacePackageId } from '$lib/shared/workspace-packages';

export const WORKSPACE_MODULE_DEFAULT_AUTH_BASE_URIS: Partial<Record<WorkspacePackageId, string>> = {
	[WORKSPACE_PACKAGE_IDS.MAILBOX]: 'https://privateemail.com',
	[WORKSPACE_PACKAGE_IDS.PAYROLL]: 'https://api.urixoft.com',
	[WORKSPACE_PACKAGE_IDS.DTR]: 'https://api.urixoft.com',
	[WORKSPACE_PACKAGE_IDS.ACCOUNTING]: 'https://api.urixoft.com',
	[WORKSPACE_PACKAGE_IDS.CRM]: 'https://api.urixoft.com',
// urx-project_management-package:module-integrations:start
	[WORKSPACE_PACKAGE_IDS.PROJECT_MANAGEMENT]: 'https://api.urixoft.com'
// urx-project_management-package:module-integrations:end
};

export const workspaceModuleIntegrationAuthBaseUriSchema = z.object({
	authBaseUri: z.string().trim().url('Enter a valid authentication base URI.')
});

export type WorkspaceModuleIntegrationAuthBaseUriInput = z.infer<
	typeof workspaceModuleIntegrationAuthBaseUriSchema
>;

export function getDefaultAuthBaseUriForPackage(packageId: WorkspacePackageId): string {
	return WORKSPACE_MODULE_DEFAULT_AUTH_BASE_URIS[packageId] ?? '';
}
