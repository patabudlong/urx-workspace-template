import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { markNotificationRead } from '$lib/server/repositories/notifications';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user?.id) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	const notification = await markNotificationRead({
		notificationId: params.id,
		userId: locals.user.id
	});

	if (!notification) {
		return jsonError('NOT_FOUND', 'Notification not found', { requestId });
	}

	return jsonOk(notification, { requestId });
};
