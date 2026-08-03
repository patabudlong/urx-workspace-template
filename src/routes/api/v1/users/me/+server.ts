import type { RequestHandler } from './$types';
import { toUserProfile } from '$lib/server/auth/user-profile';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { findUserById, updateUserProfile } from '$lib/server/repositories/users';
import { updateProfileSchema } from '$lib/shared/schemas/account';

export const GET: RequestHandler = async ({ locals, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required.', { requestId });
	}

	const user = await findUserById(locals.user.id);

	if (!user) {
		return jsonError('NOT_FOUND', 'User not found.', { requestId });
	}

	return jsonOk({ profile: toUserProfile(user) }, { requestId });
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required.', { requestId });
	}

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = updateProfileSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const updated = await updateUserProfile(locals.user.id, parsed.data);

	if (!updated) {
		return jsonError('NOT_FOUND', 'User not found.', { requestId });
	}

	return jsonOk({ profile: toUserProfile(updated) }, { requestId });
};
