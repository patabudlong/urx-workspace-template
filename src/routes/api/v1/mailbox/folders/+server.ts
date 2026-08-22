import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import {
	isMailboxConfigured,
	listMailboxFolders,
	verifyMailboxConnection
} from '$lib/server/mailbox';
import { requireMailboxWorkspace } from '$lib/server/mailbox/api-context';

export const GET: RequestHandler = async ({ locals, request, url }) => {
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

	try {
		const folders = await listMailboxFolders(locals.user!.id);
		return jsonOk({ folders }, { requestId });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to list mailbox folders';
		return jsonError('INTERNAL_ERROR', message, { requestId });
	}
};

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

	const result = await verifyMailboxConnection(locals.user!.id);
	if (!result.ok) {
		return jsonError('SERVICE_UNAVAILABLE', result.message, { requestId });
	}

	return jsonOk(result, { requestId });
};
