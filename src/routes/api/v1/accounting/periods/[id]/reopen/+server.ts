import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import {
	AccountingPeriodActionError,
	reopenAccountingPeriodForWorkspace
} from '$lib/server/repositories/accounting-periods';
import { closePeriodSchema } from '$lib/shared/accounting/schemas';

export const POST: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireAccountingWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsed = closePeriodSchema.safeParse({ periodId: params.id });

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid period id', { requestId });
	}

	try {
		const period = await reopenAccountingPeriodForWorkspace({
			workspaceId: context.workspace.workspaceId,
			periodId: parsed.data.periodId
		});

		return jsonOk({ period }, { requestId });
	} catch (error) {
		return jsonError(
			'BAD_REQUEST',
			error instanceof AccountingPeriodActionError ? error.message : 'Could not reopen fiscal period',
			{ requestId }
		);
	}
};
