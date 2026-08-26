import type { RequestHandler } from './$types';
import { jsonError, jsonPaginated, jsonOk } from '$lib/server/api/response';
import { requirePayrollWorkspace } from '$lib/server/payroll/api-context';
import {
	createPayrollRunForWorkspace,
	listPayrollRunsForWorkspace
} from '$lib/server/repositories/payroll-runs';
import {
	buildSecurityEventRequestContext,
	recordPayrollSecurityEvent
} from '$lib/server/security/record-security-event';
import { createPayrollRunSchema, payrollRunsQuerySchema } from '$lib/shared/payroll/schemas';
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

	const parsed = payrollRunsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { page, limit } = parsed.data;
	const { items, total } = await listPayrollRunsForWorkspace({
		workspaceId: context.workspace.workspaceId,
		page,
		limit
	});

	return jsonPaginated(
		items,
		{
			page,
			limit,
			total,
			hasMore: page * limit < total
		},
		{ requestId }
	);
};

export const POST: RequestHandler = async (event) => {
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

	const parsed = createPayrollRunSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const run = await createPayrollRunForWorkspace({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	});

	if (locals.user?.id) {
		await recordPayrollSecurityEvent({
			workspaceId: context.workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_RUN_CREATED,
			...buildSecurityEventRequestContext({ request, getClientAddress }),
			metadata: {
				detail: `Created pay run "${run.title}" (${run.periodStart} to ${run.periodEnd}).`,
				runId: run.id,
				title: run.title,
				periodStart: run.periodStart,
				periodEnd: run.periodEnd
			}
		});
	}

	return jsonOk(run, { status: 201, requestId });
};
