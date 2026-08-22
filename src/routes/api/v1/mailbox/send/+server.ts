import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { isMailboxConfigured, sendMailboxMessage } from '$lib/server/mailbox';
import { MAILBOX_SEND_MESSAGE_SCHEMA } from '$lib/shared/mailbox/schemas';
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

	if (!(await isMailboxConfigured(locals.user!.id))) {
		return jsonError('SERVICE_UNAVAILABLE', 'Mailbox is not connected for this user', { requestId });
	}

	const body = await request.json().catch(() => null);
	const parsed = MAILBOX_SEND_MESSAGE_SCHEMA.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	try {
		const result = await sendMailboxMessage(locals.user!.id, parsed.data, {
			requestOrigin: new URL(request.url).origin
		});
		return jsonOk(result, { requestId, status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to send message';
		return jsonError('INTERNAL_ERROR', message, { requestId });
	}
};
