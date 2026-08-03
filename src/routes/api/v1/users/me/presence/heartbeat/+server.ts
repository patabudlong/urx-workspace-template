import type { RequestHandler } from './$types';
import { toUserProfile } from '$lib/server/auth/user-profile';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { touchUserPresence } from '$lib/server/repositories/users';

export const POST: RequestHandler = async ({ locals, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required.', { requestId });
	}

	const updated = await touchUserPresence(locals.user.id);

	if (!updated) {
		return jsonError('NOT_FOUND', 'User not found.', { requestId });
	}

	return jsonOk({ profile: toUserProfile(updated) }, { requestId });
};
