import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listWorkspaceSmsMessages } from '$lib/server/repositories/workspace-sms-messages';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace } = await parent();

	if (!workspace) {
		error(404, 'Not found');
	}
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const limit = 20;

	const result = listWorkspaceSmsMessages({
		workspaceId: workspace.workspaceId,
		page,
		limit
	});

	return {
		messages: result.then((value) => value.items),
		pagination: result.then((value) => ({
			page,
			limit,
			total: value.total,
			hasMore: page * limit < value.total
		})),
		meta: {
			title: 'Message log'
		}
	};
};
