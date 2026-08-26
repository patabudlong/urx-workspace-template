import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireDtrWorkspace } from '$lib/server/dtr/api-context';
import {
	listDtrWorkSchedulesForWorkspace,
	replaceDtrWorkSchedulesForWorkspace
} from '$lib/server/repositories/dtr-work-schedules';
import {
	buildSecurityEventRequestContext,
	recordDtrSecurityEvent
} from '$lib/server/security/record-security-event';
import { dtrWorkSchedulesSchema } from '$lib/shared/dtr/schemas';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';

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

export const PUT: RequestHandler = async (event) => {
	const { locals, request, url, getClientAddress } = event;
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

	if (locals.user?.id) {
		await recordDtrSecurityEvent({
			workspaceId: context.workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.DTR_WORK_SCHEDULES_UPDATED,
			...buildSecurityEventRequestContext({ request, getClientAddress }),
			metadata: {
				detail: `Saved ${schedules.length} work schedule${schedules.length === 1 ? '' : 's'}.`,
				scheduleCount: schedules.length
			}
		});
	}

	return jsonOk({ schedules }, { requestId });
};
