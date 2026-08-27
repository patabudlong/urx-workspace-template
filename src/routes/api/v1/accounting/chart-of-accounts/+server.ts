import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import { listAccountingAccountsForWorkspace } from '$lib/server/repositories/accounting-accounts';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireAccountingWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const accounts = await listAccountingAccountsForWorkspace(context.workspace.workspaceId);
	return jsonOk({ accounts }, { requestId });
};
