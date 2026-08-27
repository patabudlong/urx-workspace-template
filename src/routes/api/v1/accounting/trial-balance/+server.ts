import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import { buildTrialBalanceForWorkspace } from '$lib/server/repositories/accounting-trial-balance';

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

	const periodId = url.searchParams.get('periodId');
	if (!periodId) {
		return jsonError('BAD_REQUEST', 'periodId query parameter is required', { requestId });
	}

	const trialBalance = await buildTrialBalanceForWorkspace({
		workspaceId: context.workspace.workspaceId,
		periodId
	});

	if (!trialBalance) {
		return jsonError('NOT_FOUND', 'Fiscal period not found', { requestId });
	}

	return jsonOk(trialBalance, { requestId });
};
