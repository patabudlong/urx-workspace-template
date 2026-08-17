import type { RequestHandler } from './$types';
import { jsonError, jsonPaginated } from '$lib/server/api/response';
import { listPayrollRunsForWorkspace } from '$lib/server/repositories/payroll-runs';
import { canManagePayroll } from '$lib/shared/payroll/access';
import { payrollRunsQuerySchema } from '$lib/shared/payroll/schemas';
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

	const parsed = payrollRunsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { page, limit } = parsed.data;
	const { items, total } = await listPayrollRunsForWorkspace({
		workspaceId: workspace.workspaceId,
		page,
		limit
	});

	return jsonPaginated(
		items,
		{
			page,
			limit,
			total,
			hasMore: page * limit < total
		},
		{ requestId }
	);
};
