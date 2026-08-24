import type { PageServerLoad } from './$types';
import { buildWorkspaceOverview } from '$lib/server/dashboard/build-workspace-overview';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	return {
		overview: workspace ? await buildWorkspaceOverview(workspace) : null,
		meta: {
			title: 'Overview'
		}
	};
};
