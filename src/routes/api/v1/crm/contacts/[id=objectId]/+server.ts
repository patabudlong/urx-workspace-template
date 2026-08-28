import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireCrmWorkspace } from '$lib/server/crm/api-context';
import { getCrmContactForWorkspace } from '$lib/server/repositories/crm-contacts';

export const GET: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireCrmWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const contact = await getCrmContactForWorkspace({
		workspaceId: context.workspace.workspaceId,
		contactId: params.id
	});

	if (!contact) {
		return jsonError('NOT_FOUND', 'Contact not found', { requestId });
	}

	return jsonOk(contact, { requestId });
};
