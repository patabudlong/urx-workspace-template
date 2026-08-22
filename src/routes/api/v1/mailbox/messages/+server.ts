import type { RequestHandler } from './$types';
import { jsonError, jsonPaginated } from '$lib/server/api/response';
import { isMailboxConfigured, listMailboxMessages } from '$lib/server/mailbox';
import { MAILBOX_LIST_MESSAGES_QUERY_SCHEMA } from '$lib/shared/mailbox/schemas';
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

	const parsed = MAILBOX_LIST_MESSAGES_QUERY_SCHEMA.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	try {
		const { folder, page, limit, q: query } = parsed.data;
		const { items, total } = await listMailboxMessages(locals.user!.id, folder, page, limit, {
			query
		});
		const hasMore = page * limit < total;

		return jsonPaginated(items, { page, limit, total, hasMore }, { requestId });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to list mailbox messages';
		return jsonError('INTERNAL_ERROR', message, { requestId });
	}
};
