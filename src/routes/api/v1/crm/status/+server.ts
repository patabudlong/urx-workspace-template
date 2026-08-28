import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { requireCrmWorkspace } from '$lib/server/crm/api-context';
import { countCrmCompaniesForWorkspace } from '$lib/server/repositories/crm-companies';
import { countCrmContactsForWorkspace } from '$lib/server/repositories/crm-contacts';
import { countCrmDealsForWorkspace, countOpenCrmDealsForWorkspace } from '$lib/server/repositories/crm-deals';
import { getCrmSeedStatusForWorkspace } from '$lib/server/repositories/crm-seed';

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

	const workspaceId = context.workspace.workspaceId;
	const [contactCount, companyCount, dealCount, openDealCount, seedStatus] = await Promise.all([
		countCrmContactsForWorkspace(workspaceId),
		countCrmCompaniesForWorkspace(workspaceId),
		countCrmDealsForWorkspace(workspaceId),
		countOpenCrmDealsForWorkspace(workspaceId),
		getCrmSeedStatusForWorkspace(workspaceId)
	]);

	return jsonOk(
		{
			enabled: true,
			workspaceId,
			contactCount,
			companyCount,
			dealCount,
			openDealCount,
			seedStatus
		},
		{ requestId }
	);
};
