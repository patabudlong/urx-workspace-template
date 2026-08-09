import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { getMailboxConnectionStatus } from '$lib/server/repositories/user-mailbox-credentials';

export const GET: RequestHandler = async ({ locals, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	const status = await getMailboxConnectionStatus(locals.user.id);
	return jsonOk(status, { requestId });
};
