import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { getMailboxConnectionStatus } from '$lib/server/repositories/user-mailbox-credentials';
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

	const status = await getMailboxConnectionStatus(locals.user!.id);
	return jsonOk(status, { requestId });
};
