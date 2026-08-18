import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireDtrWorkspace } from '$lib/server/dtr/api-context';
import {
	listDtrWorkSchedulesForWorkspace,
	replaceDtrWorkSchedulesForWorkspace
} from '$lib/server/repositories/dtr-work-schedules';
import { dtrWorkSchedulesSchema } from '$lib/shared/dtr/schemas';

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

	const schedules = await listDtrWorkSchedulesForWorkspace(context.workspace.workspaceId);
	return jsonOk({ schedules }, { requestId });
};

export const PUT: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireDtrWorkspace({
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

	const parsed = dtrWorkSchedulesSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const schedules = await replaceDtrWorkSchedulesForWorkspace({
		workspaceId: context.workspace.workspaceId,
		schedules: parsed.data.schedules
	});

	return jsonOk({ schedules }, { requestId });
};
