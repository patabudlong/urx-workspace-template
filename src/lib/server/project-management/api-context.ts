import { canManageProjectManagement } from '$lib/shared/project-management/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import { requireWorkspaceModuleApiContext } from '$lib/server/workspace-packages/access';

type ProjectManagementApiContextResult =
	| {
			ok: true;
			workspace: WorkspaceContext;
			requestId?: string;
	  }
	| {
			ok: false;
			response: Response;
	  };

export async function requireProjectManagementWorkspace(input: {
	userId: string | undefined;
	url: URL;
	requestId?: string;
}): Promise<ProjectManagementApiContextResult> {
	return requireWorkspaceModuleApiContext({
		...input,
		packageId: WORKSPACE_PACKAGE_IDS.PROJECT_MANAGEMENT,
		requireRole: canManageProjectManagement,
		forbiddenMessage: 'Project Management access required'
	});
}
