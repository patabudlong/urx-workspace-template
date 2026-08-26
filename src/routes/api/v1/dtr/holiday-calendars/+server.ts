import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireDtrWorkspace } from '$lib/server/dtr/api-context';
import {
	getDtrHolidayCalendarForWorkspace,
	listDtrHolidayCalendarsForWorkspace,
	upsertDtrHolidayCalendarForWorkspace
} from '$lib/server/repositories/dtr-holiday-calendars';
import {
	buildSecurityEventRequestContext,
	recordDtrSecurityEvent
} from '$lib/server/security/record-security-event';
import { dtrHolidayCalendarQuerySchema, dtrHolidayCalendarSchema } from '$lib/shared/dtr/schemas';
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

	const parsed = dtrHolidayCalendarQuerySchema.safeParse(Object.fromEntries(url.searchParams));

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	if (parsed.data.year) {
		const calendar = await getDtrHolidayCalendarForWorkspace({
			workspaceId: context.workspace.workspaceId,
			year: parsed.data.year
		});

		return jsonOk({ calendar }, { requestId });
	}

	const calendars = await listDtrHolidayCalendarsForWorkspace(context.workspace.workspaceId);

	return jsonOk({ calendars }, { requestId });
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

	const parsed = dtrHolidayCalendarSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const calendar = await upsertDtrHolidayCalendarForWorkspace({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	});

	if (locals.user?.id) {
		await recordDtrSecurityEvent({
			workspaceId: context.workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.DTR_HOLIDAY_CALENDAR_UPDATED,
			...buildSecurityEventRequestContext({ request, getClientAddress }),
			metadata: {
				detail: `Saved holiday calendar for ${parsed.data.year}: "${parsed.data.title}".`,
				year: parsed.data.year,
				title: parsed.data.title
			}
		});
	}

	return jsonOk(calendar, { requestId });
};
