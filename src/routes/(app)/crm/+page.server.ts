import type { PageServerLoad } from './$types';
import { countCrmCompaniesForWorkspace } from '$lib/server/repositories/crm-companies';
import { countCrmContactsForWorkspace } from '$lib/server/repositories/crm-contacts';
import { countCrmDealsForWorkspace, countOpenCrmDealsForWorkspace } from '$lib/server/repositories/crm-deals';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageCrm } = await parent();

	if (!workspace || !canManageCrm) {
		return {
			contactCount: 0,
			companyCount: 0,
			dealCount: 0,
			openDealCount: 0
		};
	}

	const workspaceId = workspace.workspaceId;
	const [contactCount, companyCount, dealCount, openDealCount] = await Promise.all([
		countCrmContactsForWorkspace(workspaceId),
		countCrmCompaniesForWorkspace(workspaceId),
		countCrmDealsForWorkspace(workspaceId),
		countOpenCrmDealsForWorkspace(workspaceId)
	]);

	return {
		contactCount,
		companyCount,
		dealCount,
		openDealCount
	};
};
