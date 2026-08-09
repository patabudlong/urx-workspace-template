import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { isMailboxConfigured, listMailboxFolderPage } from '$lib/server/mailbox';
import { MAILBOX_LIST_MESSAGES_QUERY_SCHEMA } from '$lib/shared/mailbox/schemas';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	if (!(await isMailboxConfigured(locals.user.id))) {
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
		const { folders, items, total } = await listMailboxFolderPage(
			locals.user.id,
			folder,
			page,
			limit,
			{ query }
		);
		const hasMore = page * limit < total;

		return jsonOk(
			{
				folders,
				messages: items,
				pagination: { page, limit, total, hasMore }
			},
			{ requestId }
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load mailbox folder page';
		return jsonError('INTERNAL_ERROR', message, { requestId });
	}
};
