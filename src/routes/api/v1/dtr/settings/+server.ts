import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireDtrWorkspace } from '$lib/server/dtr/api-context';
import {
	getDtrSettingsForWorkspace,
	upsertDtrSettingsForWorkspace
} from '$lib/server/repositories/dtr-settings';
import {
	buildSecurityEventRequestContext,
	recordDtrSecurityEvent
} from '$lib/server/security/record-security-event';
import { dtrSettingsSchema } from '$lib/shared/dtr/schemas';
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

	const settings = await getDtrSettingsForWorkspace(context.workspace.workspaceId);
	return jsonOk(settings, { requestId });
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

	const parsed = dtrSettingsSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const settings = await upsertDtrSettingsForWorkspace({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	});

	if (locals.user?.id) {
		await recordDtrSecurityEvent({
			workspaceId: context.workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.DTR_SETTINGS_UPDATED,
			...buildSecurityEventRequestContext({ request, getClientAddress }),
			metadata: {
				detail: 'Updated DTR settings (rest days, standard work minutes, lunch break).'
			}
		});
	}

	return jsonOk(settings, { requestId });
};
