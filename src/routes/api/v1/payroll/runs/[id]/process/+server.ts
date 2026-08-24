import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { processPayrollRunForWorkspace } from '$lib/server/payroll/process-run';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	PAYROLL_RUN_ALREADY_PROCESSED_MESSAGE,
	PAYROLL_RUN_NOT_FOUND_MESSAGE,
	PAYROLL_RUN_PROCESS_FAILED_MESSAGE
} from '$lib/shared/payroll/messages';
import { payrollRunIdParamSchema } from '$lib/shared/payroll/schemas';

export const POST: RequestHandler = async ({ locals, request, url, params }) => {
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

	const result = await processPayrollRunForWorkspace({
		workspaceId: context.workspace.workspaceId,
		runId: parsedParams.data.id
	});

	if (!result.ok) {
		if (result.code === 'NOT_FOUND') {
			return jsonError('NOT_FOUND', PAYROLL_RUN_NOT_FOUND_MESSAGE, { requestId });
		}

		if (result.code === 'INVALID_STATUS') {
			return jsonError('CONFLICT', PAYROLL_RUN_ALREADY_PROCESSED_MESSAGE, { requestId });
		}

		return jsonError('INTERNAL_ERROR', PAYROLL_RUN_PROCESS_FAILED_MESSAGE, { requestId });
	}

	return jsonOk(result.run, { requestId });
};
