import type { PageServerLoad } from './$types';
import { listAccountSecurityEvents } from '$lib/server/repositories/security-events';
import { requireWorkspaceMember } from '$lib/server/workspace-access';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const unusualOnly = url.searchParams.get('unusual') === 'true';

	const { items, total } = await listAccountSecurityEvents({
		userId: locals.user!.id,
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
			title: 'Recent activity'
		}
	};
};
