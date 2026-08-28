import type { PageServerLoad } from './$types';
import {
	countActivePmProjectsForWorkspace,
	countPmProjectsForWorkspace
} from '$lib/server/repositories/pm-projects';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageProjectManagement: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			projectCount: 0,
			activeProjectCount: 0
		};
	}

	const workspaceId = workspace.workspaceId;
	const [projectCount, activeProjectCount] = await Promise.all([
		countPmProjectsForWorkspace(workspaceId),
		countActivePmProjectsForWorkspace(workspaceId)
	]);

	return {
		projectCount,
		activeProjectCount
	};
};
