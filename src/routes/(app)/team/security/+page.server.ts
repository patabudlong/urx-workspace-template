import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listWorkspaceSecurityEvents } from '$lib/server/repositories/security-events';
import { requireWorkspaceMember } from '$lib/server/workspace-access';
import { canViewWorkspaceSecurityLog } from '$lib/shared/team/member-management';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	if (!canViewWorkspaceSecurityLog(workspace.role)) {
		error(403, 'You do not have permission to view the workspace security log.');
	}

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const unusualOnly = url.searchParams.get('unusual') === 'true';

	const { items, total } = await listWorkspaceSecurityEvents({
		workspaceId: workspace.workspaceId,
		page,
		limit: PAGE_SIZE,
		unusualOnly
	});

	return {
		events: items,
		page,
		limit: PAGE_SIZE,
		total,
		unusualOnly,
		meta: {
			title: 'Security log'
		}
	};
};
