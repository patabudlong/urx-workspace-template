import type { RequestHandler } from './$types';
import { jsonError, jsonOk, jsonPaginated } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	createPayrollEmployeeForWorkspace,
	listPayrollEmployeesForWorkspace
} from '$lib/server/repositories/payroll-employees';
import {
	createPayrollEmployeeSchema,
	payrollEmployeesQuerySchema
} from '$lib/shared/payroll/schemas';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requirePayrollWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsed = payrollEmployeesQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { page, limit } = parsed.data;
	const { items, total } = await listPayrollEmployeesForWorkspace({
		workspaceId: context.workspace.workspaceId,
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

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requirePayrollWorkspace({
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
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = createPayrollEmployeeSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const employee = await createPayrollEmployeeForWorkspace({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	});

	return jsonOk(employee, { status: 201, requestId });
};
