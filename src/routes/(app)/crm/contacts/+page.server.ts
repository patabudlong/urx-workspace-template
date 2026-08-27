import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listCrmContacts } from '$lib/server/repositories/crm-contacts';
import { CRM_DEFAULT_PAGE_LIMIT } from '$lib/server/crm/config';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace } = await parent();

	if (!workspace) {
		error(404, 'Not found');
	}

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const search = url.searchParams.get('search')?.trim() || undefined;
	const limit = CRM_DEFAULT_PAGE_LIMIT;

	const result = listCrmContacts({
		workspaceId: workspace.workspaceId,
		page,
		limit,
		search
	});

	return {
		contacts: result.then((value) => value.items),
		pagination: result.then((value) => ({
			page,
			limit,
			total: value.total,
			hasMore: page * limit < value.total
		})),
		search: search ?? '',
		created: url.searchParams.get('created') === '1',
		meta: {
			title: 'Contacts'
		}
	};
};
