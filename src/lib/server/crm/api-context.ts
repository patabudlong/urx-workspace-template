import { canManageCrm } from '$lib/shared/crm/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import { requireWorkspaceModuleApiContext } from '$lib/server/workspace-packages/access';

type CrmApiContextResult =
	| {
			ok: true;
			workspace: WorkspaceContext;
			requestId?: string;
	  }
	| {
			ok: false;
			response: Response;
	  };

export async function requireCrmWorkspace(input: {
	userId: string | undefined;
	url: URL;
	requestId?: string;
}): Promise<CrmApiContextResult> {
	return requireWorkspaceModuleApiContext({
		...input,
		packageId: WORKSPACE_PACKAGE_IDS.CRM,
		requireRole: canManageCrm,
		forbiddenMessage: 'CRM access required'
	});
}
