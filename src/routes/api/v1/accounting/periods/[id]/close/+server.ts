import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import { closeAccountingPeriodForWorkspace } from '$lib/server/repositories/accounting-periods';
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

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		body = {};
	}

	const parsed = closePeriodSchema.safeParse({
		periodId: params.id,
		...(typeof body === 'object' && body !== null ? body : {})
	});

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const period = await closeAccountingPeriodForWorkspace({
		workspaceId: context.workspace.workspaceId,
		periodId: parsed.data.periodId
	});

	if (!period) {
		return jsonError('BAD_REQUEST', 'Could not close fiscal period', { requestId });
	}

	return jsonOk({ period }, { requestId });
};
