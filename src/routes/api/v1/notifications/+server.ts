import type { RequestHandler } from './$types';
import { jsonError, jsonPaginated } from '$lib/server/api/response';
import { listNotificationsForUser } from '$lib/server/repositories/notifications';
import { notificationsQuerySchema } from '$lib/shared/schemas/notifications';

export const GET: RequestHandler = async ({ request, locals, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user?.id) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	const parsed = notificationsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { page, limit, unreadOnly, category, workspaceId } = parsed.data;

	const result = await listNotificationsForUser({
		userId: locals.user.id,
		page,
		limit,
		unreadOnly,
		category,
		workspaceId
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
