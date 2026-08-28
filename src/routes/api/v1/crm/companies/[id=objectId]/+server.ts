import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireCrmWorkspace } from '$lib/server/crm/api-context';
import { getCrmCompanyForWorkspace } from '$lib/server/repositories/crm-companies';

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

	const company = await getCrmCompanyForWorkspace({
		workspaceId: context.workspace.workspaceId,
		companyId: params.id
	});

	if (!company) {
		return jsonError('NOT_FOUND', 'Company not found', { requestId });
	}

	return jsonOk(company, { requestId });
};
