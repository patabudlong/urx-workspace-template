import type { LayoutServerLoad } from './$types';
import { getMailboxConnectionStatus } from '$lib/server/repositories/user-mailbox-credentials';
import { isMailboxConfigured, listMailboxFolders } from '$lib/server/mailbox';

export const load: LayoutServerLoad = async ({ locals }) => {
	const connection = await getMailboxConnectionStatus(locals.user!.id);

	if (!(await isMailboxConfigured(locals.user!.id))) {
		return {
			connection,
			configured: false,
			folders: Promise.resolve([])
		};
	}

	return {
		connection,
		configured: true,
		folders: listMailboxFolders(locals.user!.id)
	};
};
