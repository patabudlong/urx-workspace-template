import type { RequestHandler } from './$types';
import { jsonError, jsonOk, jsonPaginated } from '$lib/server/api/response';
import { createPmProject, listPmProjects } from '$lib/server/repositories/pm-projects';
import { requireProjectManagementWorkspace } from '$lib/server/project-management/api-context';
import { createPmProjectSchema, pmListQuerySchema } from '$lib/shared/project-management/schemas';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireProjectManagementWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const parsed = pmListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const { page, limit, search, status } = parsed.data;
	const { items, total } = await listPmProjects({
		workspaceId: context.workspace.workspaceId,
		page,
		limit,
		search,
		status
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
	const context = await requireProjectManagementWorkspace({
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

	const parsed = createPmProjectSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid project payload', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const project = await createPmProject({
		workspaceId: context.workspace.workspaceId,
		data: parsed.data
	});

	return jsonOk(project, { requestId, status: 201 });
};
