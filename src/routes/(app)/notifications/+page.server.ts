import type { PageServerLoad } from './$types';
import { listNotificationsForUser } from '$lib/server/repositories/notifications';
import { requireWorkspaceMember } from '$lib/server/workspace-access';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const unreadOnly = url.searchParams.get('unread') === 'true';

	const { items, total } = await listNotificationsForUser({
		userId: locals.user!.id,
		page,
		limit: PAGE_SIZE,
		unreadOnly
	});

	return {
		notifications: items,
		page,
		limit: PAGE_SIZE,
		total,
		unreadOnly,
		meta: {
			title: 'Notifications'
		}
	};
};
