import type { RequestHandler } from './$types';
import { jsonError, jsonPaginated } from '$lib/server/api/response';
import { listWorkspaceSmsMessages } from '$lib/server/repositories/workspace-sms-messages';
import { requireSmsWorkspace } from '$lib/server/workspace-sms/api-context';
import { workspaceSmsMessagesQuerySchema } from '$lib/shared/workspace-sms/schemas';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireSmsWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsed = workspaceSmsMessagesQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { page, limit } = parsed.data;
	const { items, total } = await listWorkspaceSmsMessages({
		workspaceId: context.workspace.workspaceId,
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
