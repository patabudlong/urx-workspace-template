import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { requireProjectManagementWorkspace } from '$lib/server/project-management/api-context';
import {
	countActivePmProjectsForWorkspace,
	countPmProjectsForWorkspace
} from '$lib/server/repositories/pm-projects';
import { getPmSeedStatusForWorkspace } from '$lib/server/repositories/pm-seed';

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

	const workspaceId = context.workspace.workspaceId;
	const [projectCount, activeProjectCount, seedStatus] = await Promise.all([
		countPmProjectsForWorkspace(workspaceId),
		countActivePmProjectsForWorkspace(workspaceId),
		getPmSeedStatusForWorkspace(workspaceId)
	]);

	return jsonOk(
		{
			enabled: true,
			workspaceId,
			projectCount,
			activeProjectCount,
			seedStatus
		},
		{ requestId }
	);
};
