import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireProjectManagementWorkspace } from '$lib/server/project-management/api-context';
import { deletePmClientInvitationsForProject } from '$lib/server/repositories/pm-client-invitations';
import {
	deletePmProjectForWorkspace,
	getPmProjectForWorkspace,
	updatePmProjectForWorkspace
} from '$lib/server/repositories/pm-projects';
import { PM_PROJECT_DELETE_FAILED_MESSAGE, PM_PROJECT_NOT_FOUND_MESSAGE } from '$lib/shared/project-management/messages';
import { updatePmProjectSchema } from '$lib/shared/project-management/schemas';

export const GET: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireProjectManagementWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const project = await getPmProjectForWorkspace({
		workspaceId: context.workspace.workspaceId,
		projectId: params.id
	});

	if (!project) {
		return jsonError('NOT_FOUND', 'Project not found', { requestId });
	}

	return jsonOk(project, { requestId });
};

export const PATCH: RequestHandler = async ({ locals, request, url, params }) => {
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

	const parsed = updatePmProjectSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid project update payload', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const project = await updatePmProjectForWorkspace({
		workspaceId: context.workspace.workspaceId,
		projectId: params.id,
		data: parsed.data
	});

	if (!project) {
		return jsonError('NOT_FOUND', 'Project not found', { requestId });
	}

	return jsonOk(project, { requestId });
};

export const DELETE: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireProjectManagementWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const project = await getPmProjectForWorkspace({
		workspaceId: context.workspace.workspaceId,
		projectId: params.id
	});

	if (!project) {
		return jsonError('NOT_FOUND', PM_PROJECT_NOT_FOUND_MESSAGE, { requestId });
	}

	await deletePmClientInvitationsForProject({
		workspaceId: context.workspace.workspaceId,
		projectId: params.id
	});

	const deleted = await deletePmProjectForWorkspace({
		workspaceId: context.workspace.workspaceId,
		projectId: params.id
	});

	if (!deleted) {
		return jsonError('INTERNAL_ERROR', PM_PROJECT_DELETE_FAILED_MESSAGE, { requestId });
	}

	return jsonOk({ deleted: true }, { requestId });
};
