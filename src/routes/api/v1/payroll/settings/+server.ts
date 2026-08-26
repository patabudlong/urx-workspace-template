import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	getPayrollSettingsForWorkspace,
	upsertPayrollSettingsForWorkspace
} from '$lib/server/repositories/payroll-settings';
import {
	buildSecurityEventRequestContext,
	recordPayrollSecurityEvent
} from '$lib/server/security/record-security-event';
import { payrollSettingsSchema } from '$lib/shared/payroll/schemas';
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
	return jsonOk(settings, { requestId });
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

	const parsed = payrollSettingsSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const settings = await upsertPayrollSettingsForWorkspace({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	});

	if (locals.user?.id) {
		await recordPayrollSecurityEvent({
			workspaceId: context.workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_SETTINGS_UPDATED,
			...buildSecurityEventRequestContext({ request, getClientAddress }),
			metadata: {
				detail: 'Updated payroll settings (pay frequency, timezone, currency, company name).',
				section: 'general'
			}
		});
	}

	return jsonOk(settings, { requestId });
};
