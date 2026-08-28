import { canManageAccounting } from '$lib/shared/accounting/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import { requireWorkspaceModuleApiContext } from '$lib/server/workspace-packages/access';

type AccountingApiContextResult =
	| {
			ok: true;
			workspace: WorkspaceContext;
			requestId?: string;
	  }
	| {
			ok: false;
			response: Response;
	  };

export async function requireAccountingWorkspace(input: {
	userId: string | undefined;
	url: URL;
	requestId?: string;
}): Promise<AccountingApiContextResult> {
	return requireWorkspaceModuleApiContext({
		...input,
		packageId: WORKSPACE_PACKAGE_IDS.ACCOUNTING,
		requireRole: canManageAccounting,
		forbiddenMessage: 'Accounting access required'
	});
}
