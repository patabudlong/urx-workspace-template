import type { LayoutServerLoad } from './$types';
import { getMailboxConnectionStatus } from '$lib/server/repositories/user-mailbox-credentials';

export const load: LayoutServerLoad = async ({ locals }) => {
	const connection = await getMailboxConnectionStatus(locals.user!.id);
	const configured = connection.connected;

	return {
		connection,
		configured
	};
};
