import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isMailboxConfigured, listMailboxMessages } from '$lib/server/mailbox';
import { decodeMailboxFolder } from '$lib/mailbox/utils';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!(await isMailboxConfigured(locals.user!.id))) {
		redirect(303, '/mailbox/settings');
	}

	const folder = decodeMailboxFolder(params.folder);
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = 25;

	return {
		folder,
		mailbox: listMailboxMessages(locals.user!.id, folder, page, limit)
			.then(({ items, total }) => ({
				messages: items,
				pagination: {
					page,
					limit,
					total,
					hasMore: page * limit < total
				}
			}))
			.catch((loadError) => {
				const message = loadError instanceof Error ? loadError.message : 'Failed to load messages';
				throw error(503, message);
			})
	};
};
