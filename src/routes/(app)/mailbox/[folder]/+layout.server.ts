import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { decodeMailboxFolder } from '$lib/mailbox/utils';
import { listMailboxFolderPage } from '$lib/server/mailbox';

export const load: LayoutServerLoad = async ({ locals, parent, params, url, depends }) => {
	depends('mailbox:messages');

	const { configured } = await parent();
	if (!configured) {
		redirect(303, '/mailbox/settings');
	}

	const folder = decodeMailboxFolder(params.folder);
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = 25;

	// Return promises so IMAP stays off the navigation critical path.
	// SvelteKit streams them; the shell paints immediately, then the list fills in.
	const folderPage = listMailboxFolderPage(locals.user!.id, folder, page, limit);

	return {
		folder,
		page,
		limit,
		folders: folderPage.then((result) => result.folders),
		mailbox: folderPage.then((result) => ({
			messages: result.items,
			pagination: {
				page,
				limit,
				total: result.total,
				hasMore: page * limit < result.total
			}
		}))
	};
};
