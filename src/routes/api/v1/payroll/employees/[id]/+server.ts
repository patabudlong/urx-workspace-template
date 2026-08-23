import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	deactivatePayrollEmployeeForWorkspace,
	getPayrollEmployeeForWorkspace,
	isDuplicatePayrollEmployeeCodeError,
	updatePayrollEmployeeForWorkspace
} from '$lib/server/repositories/payroll-employees';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import { PAYROLL_EMPLOYEE_CODE_TAKEN_MESSAGE } from '$lib/shared/payroll/messages';
import {
	payrollEmployeeIdParamSchema,
	updatePayrollEmployeeSchema
} from '$lib/shared/payroll/schemas';

export const GET: RequestHandler = async ({ locals, request, params, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requirePayrollWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsedParams = payrollEmployeeIdParamSchema.safeParse(params);
	if (!parsedParams.success) {
		return jsonError('BAD_REQUEST', 'Invalid employee id', {
			details: { issues: parsedParams.error.flatten() },
			requestId
		});
	}

	const employee = await getPayrollEmployeeForWorkspace({
		workspaceId: context.workspace.workspaceId,
		employeeId: parsedParams.data.id
	});

	if (!employee) {
		return jsonError('NOT_FOUND', 'Employee not found', { requestId });
	}

	return jsonOk(employee, { requestId });
};

export const PATCH: RequestHandler = async ({ locals, request, params, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requirePayrollWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsedParams = payrollEmployeeIdParamSchema.safeParse(params);
	if (!parsedParams.success) {
		return jsonError('BAD_REQUEST', 'Invalid employee id', {
			details: { issues: parsedParams.error.flatten() },
			requestId
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsedBody = updatePayrollEmployeeSchema.safeParse(body);
	if (!parsedBody.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsedBody.error.flatten() },
			requestId
		});
	}

	const settings = await getPayrollSettingsForWorkspace(context.workspace.workspaceId);

	try {
		const employee = await updatePayrollEmployeeForWorkspace({
			workspaceId: context.workspace.workspaceId,
			employeeId: parsedParams.data.id,
			data: parsedBody.data,
			currency: settings.currency
		});

		if (!employee) {
			return jsonError('NOT_FOUND', 'Employee not found', { requestId });
		}

		return jsonOk(employee, { requestId });
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

export const DELETE: RequestHandler = async ({ locals, request, params, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requirePayrollWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsedParams = payrollEmployeeIdParamSchema.safeParse(params);
	if (!parsedParams.success) {
		return jsonError('BAD_REQUEST', 'Invalid employee id', {
			details: { issues: parsedParams.error.flatten() },
			requestId
		});
	}

	const deactivated = await deactivatePayrollEmployeeForWorkspace({
		workspaceId: context.workspace.workspaceId,
		employeeId: parsedParams.data.id
	});

	if (!deactivated) {
		return jsonError('NOT_FOUND', 'Employee not found', { requestId });
	}

	return jsonOk({ id: parsedParams.data.id, isActive: false }, { requestId });
};
