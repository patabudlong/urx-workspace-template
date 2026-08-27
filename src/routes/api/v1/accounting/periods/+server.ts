import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import { listAccountingPeriodsForWorkspace } from '$lib/server/repositories/accounting-periods';

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

	const periods = await listAccountingPeriodsForWorkspace(context.workspace.workspaceId);
	return jsonOk({ periods }, { requestId });
};
