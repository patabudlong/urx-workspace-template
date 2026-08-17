import type { RequestHandler } from './$types';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import { countPayrollEmployeesForWorkspace } from '$lib/server/repositories/payroll-employees';
import { countPayrollRunsForWorkspace } from '$lib/server/repositories/payroll-runs';
import { jsonOk } from '$lib/server/api/response';

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

	const [runCount, employeeCount] = await Promise.all([
		countPayrollRunsForWorkspace(context.workspace.workspaceId),
		countPayrollEmployeesForWorkspace(context.workspace.workspaceId)
	]);

	return jsonOk(
		{
			enabled: true,
			workspaceId: context.workspace.workspaceId,
			runCount,
			employeeCount
		},
		{ requestId }
	);
};
