import type { RequestHandler } from './$types';
import { jsonError, jsonPaginated } from '$lib/server/api/response';
import {
	listAccountSecurityEvents,
	listWorkspaceSecurityEvents
} from '$lib/server/repositories/security-events';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { SECURITY_EVENT_SCOPES } from '$lib/shared/models/security-event';
import { securityEventsQuerySchema } from '$lib/shared/schemas/security-events';
import { canViewWorkspaceSecurityLog } from '$lib/shared/team/member-management';

export const GET: RequestHandler = async ({ request, locals, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user?.id) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	const parsed = securityEventsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { scope, category, page, limit, unusualOnly } = parsed.data;

	if (scope === SECURITY_EVENT_SCOPES.ACCOUNT) {
		const result = await listAccountSecurityEvents({
			userId: locals.user.id,
			page,
			limit,
			category,
			unusualOnly
		});

		return jsonPaginated(
			result.items,
			{
				page,
				limit,
				total: result.total,
				hasMore: page * limit < result.total
			},
			{ requestId }
		);
	}

	const workspaces = await listUserWorkspaceContexts(locals.user.id);
	const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

	if (!workspace) {
		return jsonError('FORBIDDEN', 'No active workspace context', { requestId });
	}

	if (!canViewWorkspaceSecurityLog(workspace.role)) {
		return jsonError('FORBIDDEN', 'You do not have permission to view workspace security events', {
			requestId
		});
	}

	const result = await listWorkspaceSecurityEvents({
		workspaceId: workspace.workspaceId,
		page,
		limit,
		category,
		unusualOnly
	});

	return jsonPaginated(
		result.items,
		{
			page,
			limit,
			total: result.total,
			hasMore: page * limit < result.total
		},
		{ requestId }
	);
};
