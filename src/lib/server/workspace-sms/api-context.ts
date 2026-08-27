import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import { requireWorkspaceModuleApiContext } from '$lib/server/workspace-packages/access';
import { canManageSms } from '$lib/shared/workspace-sms/access';

type SmsApiContextResult =
	| {
			ok: true;
			workspace: WorkspaceContext;
			requestId?: string;
	  }
	| {
			ok: false;
			response: Response;
	  };

export async function requireSmsWorkspace(input: {
	userId: string | undefined;
	url: URL;
	requestId?: string;
}): Promise<SmsApiContextResult> {
	return requireWorkspaceModuleApiContext({
		...input,
		packageId: WORKSPACE_PACKAGE_IDS.SMS,
		requireRole: canManageSms,
		forbiddenMessage: 'SMS access required'
	});
}
