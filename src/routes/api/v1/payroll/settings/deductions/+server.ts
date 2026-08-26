import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	getPayrollSettingsForWorkspace,
	savePayrollDeductionTypesForWorkspace
} from '$lib/server/repositories/payroll-settings';
import {
	buildSecurityEventRequestContext,
	recordPayrollSecurityEvent
} from '$lib/server/security/record-security-event';
import {
	mapDeductionTypesInputToDocument,
	payrollDeductionTypesSchema
} from '$lib/shared/payroll/schemas';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';

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

	const settings = await getPayrollSettingsForWorkspace(context.workspace.workspaceId);
	return jsonOk(
		{
			workspaceId: settings.workspaceId,
			currency: settings.currency,
			types: settings.deductionTypes
		},
		{ requestId }
	);
};

export const PUT: RequestHandler = async (event) => {
	const { locals, request, url, getClientAddress } = event;
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

	const parsed = payrollDeductionTypesSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const settings = await getPayrollSettingsForWorkspace(context.workspace.workspaceId);
	const updated = await savePayrollDeductionTypesForWorkspace({
		workspaceId: context.workspace.workspaceId,
		types: mapDeductionTypesInputToDocument(parsed.data.types, settings.currency)
	});

	if (locals.user?.id) {
		await recordPayrollSecurityEvent({
			workspaceId: context.workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_SETTINGS_UPDATED,
			...buildSecurityEventRequestContext({ request, getClientAddress }),
			metadata: {
				detail: `Updated ${parsed.data.types.length} payroll deduction type${parsed.data.types.length === 1 ? '' : 's'}.`,
				section: 'deductions',
				typeCount: parsed.data.types.length
			}
		});
	}

	return jsonOk(
		{
			workspaceId: updated.workspaceId,
			currency: updated.currency,
			types: updated.deductionTypes
		},
		{ requestId }
	);
};
