import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import { countPayrollPayslipsForRun } from '$lib/server/repositories/payroll-payslips';
import {
	deletePayrollRunForWorkspace,
	getPayrollRunForWorkspace
} from '$lib/server/repositories/payroll-runs';
import {
	PAYROLL_RUN_DELETE_FAILED_MESSAGE,
	PAYROLL_RUN_DELETE_PROCESSING_MESSAGE,
	PAYROLL_RUN_NOT_FOUND_MESSAGE
} from '$lib/shared/payroll/messages';
import { payrollRunIdParamSchema } from '$lib/shared/payroll/schemas';

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

	const payslipCount = await countPayrollPayslipsForRun(
		context.workspace.workspaceId,
		parsedParams.data.id
	);

	return jsonOk({ ...run, payslipCount }, { requestId });
};

export const DELETE: RequestHandler = async ({ locals, request, url, params }) => {
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

	const result = await deletePayrollRunForWorkspace({
		workspaceId: context.workspace.workspaceId,
		runId: parsedParams.data.id
	});

	if (!result.ok) {
		if (result.code === 'NOT_FOUND') {
			return jsonError('NOT_FOUND', PAYROLL_RUN_NOT_FOUND_MESSAGE, { requestId });
		}

		if (result.code === 'PROCESSING') {
			return jsonError('CONFLICT', PAYROLL_RUN_DELETE_PROCESSING_MESSAGE, { requestId });
		}

		return jsonError('INTERNAL_ERROR', PAYROLL_RUN_DELETE_FAILED_MESSAGE, { requestId });
	}

	return jsonOk({ deleted: true }, { requestId });
};
