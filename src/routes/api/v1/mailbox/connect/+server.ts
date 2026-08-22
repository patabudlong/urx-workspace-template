import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import {
	buildMailboxConfigFromConnect,
	invalidateMailboxImapSession,
	verifyMailboxCredentials
} from '$lib/server/mailbox';
import {
	deleteMailboxCredentialsForUser,
	upsertMailboxCredentialsForUser
} from '$lib/server/repositories/user-mailbox-credentials';
import { MAILBOX_CONNECT_SCHEMA } from '$lib/shared/mailbox/schemas';
import { requireMailboxWorkspace } from '$lib/server/mailbox/api-context';

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireMailboxWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
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

	await invalidateMailboxImapSession(locals.user!.id);
	const status = await upsertMailboxCredentialsForUser(locals.user!.id, verification.config);
	return jsonOk(status, { requestId, status: 201 });
};

export const DELETE: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireMailboxWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	await invalidateMailboxImapSession(locals.user!.id);
	await deleteMailboxCredentialsForUser(locals.user!.id);
	return jsonOk({ connected: false }, { requestId });
};
