import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	getPayrollSettingsForWorkspace,
	savePayrollJobTitlesForWorkspace
} from '$lib/server/repositories/payroll-settings';
import {
	buildSecurityEventRequestContext,
	recordPayrollSecurityEvent
} from '$lib/server/security/record-security-event';
import {
	mapJobTitlesInputToDocument,
	payrollJobTitlesSchema
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
			titles: settings.jobTitles
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

	const parsed = payrollJobTitlesSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const settings = await getPayrollSettingsForWorkspace(context.workspace.workspaceId);
	const updated = await savePayrollJobTitlesForWorkspace({
		workspaceId: context.workspace.workspaceId,
		titles: mapJobTitlesInputToDocument(parsed.data.titles, settings.currency)
	});

	if (locals.user?.id) {
		await recordPayrollSecurityEvent({
			workspaceId: context.workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_SETTINGS_UPDATED,
			...buildSecurityEventRequestContext({ request, getClientAddress }),
			metadata: {
				detail: `Updated ${parsed.data.titles.length} job title${parsed.data.titles.length === 1 ? '' : 's'}.`,
				section: 'job_titles',
				titleCount: parsed.data.titles.length
			}
		});
	}

	return jsonOk(
		{
			workspaceId: updated.workspaceId,
			currency: updated.currency,
			titles: updated.jobTitles
		},
		{ requestId }
	);
};
