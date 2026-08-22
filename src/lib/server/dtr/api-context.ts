import { canManageDtr } from '$lib/shared/dtr/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import { requireWorkspaceModuleApiContext } from '$lib/server/workspace-packages/access';

type DtrApiContextResult =
	| {
			ok: true;
			workspace: WorkspaceContext;
			requestId?: string;
	  }
	| {
			ok: false;
			response: Response;
	  };

export async function requireDtrWorkspace(input: {
	userId: string | undefined;
	url: URL;
	requestId?: string;
}): Promise<DtrApiContextResult> {
	return requireWorkspaceModuleApiContext({
		...input,
		packageId: WORKSPACE_PACKAGE_IDS.DTR,
		requireRole: canManageDtr,
		forbiddenMessage: 'DTR access required'
	});
}
