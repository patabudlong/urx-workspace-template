import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	getPayrollSettingsForWorkspace,
	savePayrollJobTitlesForWorkspace
} from '$lib/server/repositories/payroll-settings';
import {
	mapJobTitlesInputToDocument,
	payrollJobTitlesSchema
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

export const PUT: RequestHandler = async ({ locals, request, url }) => {
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

	return jsonOk(
		{
			workspaceId: updated.workspaceId,
			currency: updated.currency,
			titles: updated.jobTitles
		},
		{ requestId }
	);
};
