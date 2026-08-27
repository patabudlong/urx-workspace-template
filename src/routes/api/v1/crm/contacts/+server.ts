import type { RequestHandler } from './$types';
import { jsonError, jsonOk, jsonPaginated } from '$lib/server/api/response';
import { createCrmContact, listCrmContacts } from '$lib/server/repositories/crm-contacts';
import { requireCrmWorkspace } from '$lib/server/crm/api-context';
import { createCrmContactSchema, crmListQuerySchema } from '$lib/shared/crm/schemas';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireCrmWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsed = crmListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { page, limit, search } = parsed.data;
	const { items, total } = await listCrmContacts({
		workspaceId: context.workspace.workspaceId,
		page,
		limit,
		search
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

export const POST: RequestHandler = async ({ locals, request, url }) => {
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

	const parsed = createCrmContactSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid contact payload', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const contact = await createCrmContact({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	});

	return jsonOk(contact, { requestId, status: 201 });
};
