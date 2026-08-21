import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireDtrWorkspace } from '$lib/server/dtr/api-context';
import { getDtrSettingsForWorkspace } from '$lib/server/repositories/dtr-settings';
import { countPayrollEmployeesForWorkspace } from '$lib/server/repositories/payroll-employees';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireDtrWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const [settings, employeeCount] = await Promise.all([
		getDtrSettingsForWorkspace(context.workspace.workspaceId),
		countPayrollEmployeesForWorkspace(context.workspace.workspaceId)
	]);

	return jsonOk(
		{
			workspaceId: context.workspace.workspaceId,
			configured: settings.configured,
			restDayCount: settings.restDays.length,
			employeeCount
		},
		{ requestId }
	);
};
