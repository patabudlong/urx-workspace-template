import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { countUnreadNotificationsForUser } from '$lib/server/repositories/notifications';
import { z } from 'zod';

const unreadCountQuerySchema = z.object({
	workspaceId: z.string().trim().min(1).optional()
});

export const GET: RequestHandler = async ({ request, locals, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user?.id) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	const parsed = unreadCountQuerySchema.safeParse(Object.fromEntries(url.searchParams));

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const count = await countUnreadNotificationsForUser({
		userId: locals.user.id,
		workspaceId: parsed.data.workspaceId
	});

	return jsonOk({ count }, { requestId });
};
