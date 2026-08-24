import type { RequestHandler } from './$types';
import { jsonError, jsonOk, jsonPaginated } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	createPayrollEmployeeForWorkspace,
	isDuplicatePayrollEmployeeCodeError,
	listPayrollEmployeesForWorkspace
} from '$lib/server/repositories/payroll-employees';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import { PAYROLL_EMPLOYEE_CODE_TAKEN_MESSAGE } from '$lib/shared/payroll/messages';
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

	const settings = await getPayrollSettingsForWorkspace(context.workspace.workspaceId);
	try {
		const employee = await createPayrollEmployeeForWorkspace({
			workspaceId: context.workspace.workspaceId,
			data: parsed.data,
			currency: settings.currency
		});

		return jsonOk(employee, { status: 201, requestId });
	} catch (error) {
		if (error instanceof Error && error.message === 'Invalid work schedule') {
			return jsonError('BAD_REQUEST', 'Selected work schedule is invalid or no longer available.', {
				requestId
			});
		}

		if (isDuplicatePayrollEmployeeCodeError(error)) {
			return jsonError('BAD_REQUEST', PAYROLL_EMPLOYEE_CODE_TAKEN_MESSAGE, { requestId });
		}

		throw error;
	}
};
