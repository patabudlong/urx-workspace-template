import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { getMailboxMessage, isMailboxConfigured, performMailboxMessageAction } from '$lib/server/mailbox';
import {
	MAILBOX_MESSAGE_ACTION_SCHEMA,
	MAILBOX_MESSAGE_UID_PARAM_SCHEMA
} from '$lib/shared/mailbox/schemas';

export const GET: RequestHandler = async ({ locals, request, params, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	if (!(await isMailboxConfigured(locals.user.id))) {
		return jsonError('SERVICE_UNAVAILABLE', 'Mailbox is not connected for this user', { requestId });
	}

	const parsed = MAILBOX_MESSAGE_UID_PARAM_SCHEMA.safeParse(params);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid message id', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const folder = url.searchParams.get('folder')?.trim();
	if (!folder) {
		return jsonError('BAD_REQUEST', 'folder query parameter is required', { requestId });
	}

	try {
		const message = await getMailboxMessage(locals.user.id, folder, parsed.data.uid);
		if (!message) {
			return jsonError('NOT_FOUND', 'Message not found', { requestId });
		}

		return jsonOk(message, { requestId });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load mailbox message';
		return jsonError('INTERNAL_ERROR', message, { requestId });
	}
};

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	if (!(await isMailboxConfigured(locals.user.id))) {
		return jsonError('SERVICE_UNAVAILABLE', 'Mailbox is not connected for this user', { requestId });
	}

	const parsedParams = MAILBOX_MESSAGE_UID_PARAM_SCHEMA.safeParse(params);
	if (!parsedParams.success) {
		return jsonError('BAD_REQUEST', 'Invalid message id', {
			details: { issues: parsedParams.error.flatten() },
			requestId
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsedBody = MAILBOX_MESSAGE_ACTION_SCHEMA.safeParse(body);
	if (!parsedBody.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsedBody.error.flatten() },
			requestId
		});
	}

	try {
		const result = await performMailboxMessageAction(
			locals.user.id,
			parsedBody.data.folder,
			parsedParams.data.uid,
			parsedBody.data.action
		);

		return jsonOk(result, { requestId });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to update mailbox message';
		if (message === 'Message not found') {
			return jsonError('NOT_FOUND', message, { requestId });
		}

		return jsonError('INTERNAL_ERROR', message, { requestId });
	}
};
