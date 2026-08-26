import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { markAllNotificationsRead } from '$lib/server/repositories/notifications';
import { notificationsReadAllSchema } from '$lib/shared/schemas/notifications';

export const POST: RequestHandler = async ({ request, locals }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user?.id) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	const body = await request.json().catch(() => ({}));
	const parsed = notificationsReadAllSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const updatedCount = await markAllNotificationsRead({
		userId: locals.user.id,
		workspaceId: parsed.data.workspaceId
	});

	return jsonOk({ updatedCount }, { requestId });
};
