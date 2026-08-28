import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireCrmWorkspace } from '$lib/server/crm/api-context';
import { getCrmDealForWorkspace, updateCrmDealForWorkspace } from '$lib/server/repositories/crm-deals';
import { updateCrmDealSchema } from '$lib/shared/crm/schemas';

export const GET: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireCrmWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const deal = await getCrmDealForWorkspace({
		workspaceId: context.workspace.workspaceId,
		dealId: params.id
	});

	if (!deal) {
		return jsonError('NOT_FOUND', 'Deal not found', { requestId });
	}

	return jsonOk(deal, { requestId });
};

export const PATCH: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireCrmWorkspace({
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

	const parsed = updateCrmDealSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid deal update payload', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const deal = await updateCrmDealForWorkspace({
		workspaceId: context.workspace.workspaceId,
		dealId: params.id,
		data: parsed.data
	});

	if (!deal) {
		return jsonError('NOT_FOUND', 'Deal not found', { requestId });
	}

	return jsonOk(deal, { requestId });
};
