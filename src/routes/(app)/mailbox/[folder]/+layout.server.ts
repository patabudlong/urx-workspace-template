import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { decodeMailboxFolder } from '$lib/mailbox/utils';
import { listMailboxFolders, listMailboxMessages } from '$lib/server/mailbox';

export const load: LayoutServerLoad = async ({ locals, parent, params, url, depends }) => {
	depends('mailbox:messages');

	const { configured } = await parent();
	if (!configured) {
		redirect(303, '/mailbox/settings');
	}

	const folder = decodeMailboxFolder(params.folder);
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = 25;
	const userId = locals.user!.id;

	// Stream messages independently of folder STATUS. Queue order matters: start
	// the message list first so it resolves (and paints) before sidebar counts.
	const messagesPromise = listMailboxMessages(userId, folder, page, limit);
	const foldersPromise = listMailboxFolders(userId);

	return {
		folder,
		page,
		limit,
		folders: foldersPromise,
		mailbox: messagesPromise.then(({ items, total }) => ({
			messages: items,
			pagination: {
				page,
				limit,
				total,
				hasMore: page * limit < total
			}
		}))
	};
};
