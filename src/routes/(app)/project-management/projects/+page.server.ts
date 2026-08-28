import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listPmProjects } from '$lib/server/repositories/pm-projects';
import { PM_DEFAULT_PAGE_LIMIT } from '$lib/server/project-management/config';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace } = await parent();

	if (!workspace) {
		error(404, 'Not found');
	}

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const search = url.searchParams.get('search')?.trim() || undefined;
	const limit = PM_DEFAULT_PAGE_LIMIT;

	const result = listPmProjects({
		workspaceId: workspace.workspaceId,
		page,
		limit,
		search
	});

	return {
		projects: result.then((value) => value.items),
		pagination: result.then((value) => ({
			page,
			limit,
			total: value.total,
			hasMore: page * limit < value.total
		})),
		search: search ?? '',
		meta: {
			title: 'Projects'
		}
	};
};
