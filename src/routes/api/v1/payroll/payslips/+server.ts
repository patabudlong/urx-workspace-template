import type { RequestHandler } from './$types';
import { jsonError, jsonPaginated } from '$lib/server/api/response';
import { requirePayrollMemberWorkspace } from '$lib/server/payroll/api-context';
import { findPayrollEmployeeForWorkspaceUser } from '$lib/server/repositories/payroll-employees';
import { listPayrollPayslipsForEmployee } from '$lib/server/repositories/payroll-payslips';
import { PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE } from '$lib/shared/payroll/messages';
import { payrollPayslipsQuerySchema } from '$lib/shared/payroll/schemas';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requirePayrollMemberWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const userEmail = locals.user?.email;

	if (!userEmail) {
		return jsonError('FORBIDDEN', PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE, { requestId });
	}

	const employee = await findPayrollEmployeeForWorkspaceUser({
		workspaceId: context.workspace.workspaceId,
		userId: locals.user!.id,
		email: userEmail
	});

	if (!employee) {
		return jsonError('FORBIDDEN', PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE, { requestId });
	}

	const parsed = payrollPayslipsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { page, limit } = parsed.data;
	const { items, total } = await listPayrollPayslipsForEmployee({
		workspaceId: context.workspace.workspaceId,
		employeeId: employee.id,
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
