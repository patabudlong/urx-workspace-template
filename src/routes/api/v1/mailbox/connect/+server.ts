import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { buildMailboxConfigFromConnect, verifyMailboxCredentials } from '$lib/server/mailbox';
import {
	deleteMailboxCredentialsForUser,
	upsertMailboxCredentialsForUser
} from '$lib/server/repositories/user-mailbox-credentials';
import { MAILBOX_CONNECT_SCHEMA } from '$lib/shared/mailbox/schemas';

export const POST: RequestHandler = async ({ locals, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	const body = await request.json().catch(() => null);
	const parsed = MAILBOX_CONNECT_SCHEMA.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const config = buildMailboxConfigFromConnect(parsed.data);
	const verification = await verifyMailboxCredentials(config);
	if (!verification.ok) {
		return jsonError('BAD_REQUEST', verification.message, { requestId });
	}

	const status = await upsertMailboxCredentialsForUser(locals.user.id, verification.config);
	return jsonOk(status, { requestId, status: 201 });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	await deleteMailboxCredentialsForUser(locals.user.id);
	return jsonOk({ connected: false }, { requestId });
};
