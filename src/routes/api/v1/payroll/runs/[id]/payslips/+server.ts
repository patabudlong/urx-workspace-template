import type { RequestHandler } from './$types';
import { jsonError, jsonPaginated } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import { getPayrollRunForWorkspace } from '$lib/server/repositories/payroll-runs';
import { listPayrollPayslipsForRun } from '$lib/server/repositories/payroll-payslips';
import { payrollPayslipsQuerySchema, payrollRunIdParamSchema } from '$lib/shared/payroll/schemas';

export const GET: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requirePayrollWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsedParams = payrollRunIdParamSchema.safeParse(params);
	if (!parsedParams.success) {
		return jsonError('BAD_REQUEST', 'Invalid pay run id', {
			details: { issues: parsedParams.error.flatten() },
			requestId
		});
	}

	const run = await getPayrollRunForWorkspace({
		workspaceId: context.workspace.workspaceId,
		runId: parsedParams.data.id
	});

	if (!run) {
		return jsonError('NOT_FOUND', 'Pay run not found', { requestId });
	}

	const parsedQuery = payrollPayslipsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsedQuery.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsedQuery.error.flatten() },
			requestId
		});
	}

	const { page, limit } = parsedQuery.data;
	const { items, total } = await listPayrollPayslipsForRun({
		workspaceId: context.workspace.workspaceId,
		runId: parsedParams.data.id,
		page,
		limit
	});

	return jsonPaginated(
		items,
		{
			page,
			limit,
			total,
			hasMore: page * limit < total
		},
		{ requestId }
	);
};
