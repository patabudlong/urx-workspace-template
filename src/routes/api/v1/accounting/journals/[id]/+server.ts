import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import { getAccountingJournalEntryForWorkspace } from '$lib/server/repositories/accounting-journal-entries';

export const GET: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireAccountingWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const entry = await getAccountingJournalEntryForWorkspace({
		workspaceId: context.workspace.workspaceId,
		entryId: params.id
	});

	if (!entry) {
		return jsonError('NOT_FOUND', 'Journal entry not found', { requestId });
	}

	return jsonOk({ entry }, { requestId });
};
