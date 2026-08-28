import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireCrmWorkspace } from '$lib/server/crm/api-context';
import {
	deleteCrmSeedForWorkspace,
	getCrmSeedStatusForWorkspace,
	seedCrmWorkspace
} from '$lib/server/repositories/crm-seed';
import {
	CRM_SEED_ALREADY_EXISTS_MESSAGE,
	CRM_SEED_CREATE_FAILED_MESSAGE,
	CRM_SEED_DELETE_FAILED_MESSAGE,
	CRM_SEED_NOT_FOUND_MESSAGE
} from '$lib/shared/crm/messages';

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

	const seedStatus = await getCrmSeedStatusForWorkspace(context.workspace.workspaceId);
	return jsonOk(seedStatus, { requestId });
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

	try {
		const seedStatus = await seedCrmWorkspace(context.workspace.workspaceId);
		return jsonOk(seedStatus, { requestId });
	} catch (error) {
		if (error instanceof Error && error.message === 'CRM seed already exists') {
			return jsonError('CONFLICT', CRM_SEED_ALREADY_EXISTS_MESSAGE, { requestId });
		}

		return jsonError('INTERNAL_ERROR', CRM_SEED_CREATE_FAILED_MESSAGE, { requestId });
	}
};

export const DELETE: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireCrmWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	try {
		const seedStatus = await deleteCrmSeedForWorkspace(context.workspace.workspaceId);
		return jsonOk(seedStatus, { requestId });
	} catch (error) {
		if (error instanceof Error && error.message === 'CRM seed not found') {
			return jsonError('NOT_FOUND', CRM_SEED_NOT_FOUND_MESSAGE, { requestId });
		}

		return jsonError('INTERNAL_ERROR', CRM_SEED_DELETE_FAILED_MESSAGE, { requestId });
	}
};
