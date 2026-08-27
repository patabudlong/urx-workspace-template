import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import {
	getAccountingSettingsForWorkspace,
	upsertAccountingSettingsForWorkspace
} from '$lib/server/repositories/accounting-settings';
import { accountingSettingsSchema } from '$lib/shared/accounting/schemas';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireAccountingWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const settings = await getAccountingSettingsForWorkspace(context.workspace.workspaceId);
	return jsonOk(settings, { requestId });
};

export const PUT: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireAccountingWorkspace({
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

	const parsed = accountingSettingsSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const settings = await upsertAccountingSettingsForWorkspace({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	});

	return jsonOk(settings, { requestId });
};
