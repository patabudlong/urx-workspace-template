import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireProjectManagementWorkspace } from '$lib/server/project-management/api-context';
import {
	deletePmSeedForWorkspace,
	getPmSeedStatusForWorkspace,
	seedPmWorkspace
} from '$lib/server/repositories/pm-seed';
import {
	PM_SEED_ALREADY_EXISTS_MESSAGE,
	PM_SEED_CREATE_FAILED_MESSAGE,
	PM_SEED_DELETE_FAILED_MESSAGE,
	PM_SEED_NOT_FOUND_MESSAGE
} from '$lib/shared/project-management/messages';

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

	const seedStatus = await getPmSeedStatusForWorkspace(context.workspace.workspaceId);
	return jsonOk(seedStatus, { requestId });
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

	try {
		const seedStatus = await seedPmWorkspace(context.workspace.workspaceId);
		return jsonOk(seedStatus, { requestId });
	} catch (error) {
		if (error instanceof Error && error.message === 'PM seed already exists') {
			return jsonError('CONFLICT', PM_SEED_ALREADY_EXISTS_MESSAGE, { requestId });
		}

		return jsonError('INTERNAL_ERROR', PM_SEED_CREATE_FAILED_MESSAGE, { requestId });
	}
};

export const DELETE: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireProjectManagementWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	try {
		const seedStatus = await deletePmSeedForWorkspace(context.workspace.workspaceId);
		return jsonOk(seedStatus, { requestId });
	} catch (error) {
		if (error instanceof Error && error.message === 'PM seed not found') {
			return jsonError('NOT_FOUND', PM_SEED_NOT_FOUND_MESSAGE, { requestId });
		}

		return jsonError('INTERNAL_ERROR', PM_SEED_DELETE_FAILED_MESSAGE, { requestId });
	}
};
