import { jsonError } from '$lib/server/api/response';
import { canManagePayroll } from '$lib/shared/payroll/access';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import type { WorkspaceContext } from '$lib/shared/workspace-context';

type PayrollApiContextResult =
	| {
			ok: true;
			workspace: WorkspaceContext;
			requestId?: string;
	  }
	| {
			ok: false;
			response: Response;
	  };

export async function requirePayrollWorkspace(input: {
	userId: string | undefined;
	url: URL;
	requestId?: string;
}): Promise<PayrollApiContextResult> {
	const { userId, url, requestId } = input;

	if (!userId) {
		return {
			ok: false,
			response: jsonError('UNAUTHORIZED', 'Authentication required', { requestId })
		};
	}

	const workspaces = await listUserWorkspaceContexts(userId);
	const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

	if (!workspace) {
		return {
			ok: false,
			response: jsonError('FORBIDDEN', 'No active workspace', { requestId })
		};
	}

	if (!canManagePayroll(workspace.role)) {
		return {
			ok: false,
			response: jsonError('FORBIDDEN', 'Payroll access required', { requestId })
		};
	}

	return { ok: true, workspace, requestId };
}
