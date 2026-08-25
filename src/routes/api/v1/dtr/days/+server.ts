import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireDtrWorkspace } from '$lib/server/dtr/api-context';
import { isDtrDayLockedError } from '$lib/server/dtr/errors';
import { listDtrDaysForWorkspace, upsertDtrDayForWorkspace } from '$lib/server/repositories/dtr-days';
import { getMonthDateRange } from '$lib/shared/dtr/calendar';
import { DTR_DAY_LOCKED_MESSAGE } from '$lib/shared/dtr/messages';
import { dtrDaysQuerySchema, upsertDtrDaySchema } from '$lib/shared/dtr/schemas';

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

	const parsed = dtrDaysQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { start, end } = getMonthDateRange(parsed.data.month);
	const items = await listDtrDaysForWorkspace({
		workspaceId: context.workspace.workspaceId,
		startDate: start,
		endDate: end,
		employeeId: parsed.data.employeeId
	});

	return jsonOk({ month: parsed.data.month, items }, { requestId });
};

export const POST: RequestHandler = async ({ locals, request, url }) => {
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

	const parsed = upsertDtrDaySchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const day = await upsertDtrDayForWorkspace({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	}).catch((error) => {
		if (isDtrDayLockedError(error)) {
			return null;
		}

		throw error;
	});

	if (!day) {
		return jsonError('CONFLICT', DTR_DAY_LOCKED_MESSAGE, { requestId });
	}

	return jsonOk(day, { status: 201, requestId });
};
