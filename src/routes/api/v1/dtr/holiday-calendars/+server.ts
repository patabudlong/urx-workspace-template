import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireDtrWorkspace } from '$lib/server/dtr/api-context';
import {
	getDtrHolidayCalendarForWorkspace,
	listDtrHolidayCalendarsForWorkspace,
	upsertDtrHolidayCalendarForWorkspace
} from '$lib/server/repositories/dtr-holiday-calendars';
import { dtrHolidayCalendarQuerySchema, dtrHolidayCalendarSchema } from '$lib/shared/dtr/schemas';

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

	return jsonOk(calendar, { requestId });
};
