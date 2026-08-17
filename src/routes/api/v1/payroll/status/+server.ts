import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { countPayrollRunsForWorkspace } from '$lib/server/repositories/payroll-runs';
import { canManagePayroll } from '$lib/shared/payroll/access';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	const workspaces = await listUserWorkspaceContexts(locals.user.id);
	const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

	if (!workspace) {
		return jsonError('FORBIDDEN', 'No active workspace', { requestId });
	}

	if (!canManagePayroll(workspace.role)) {
		return jsonError('FORBIDDEN', 'Payroll access required', { requestId });
	}

	const runCount = await countPayrollRunsForWorkspace(workspace.workspaceId);

	return jsonOk(
		{
			enabled: true,
			workspaceId: workspace.workspaceId,
			runCount
		},
		{ requestId }
	);
};
