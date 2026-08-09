import type { LayoutServerLoad } from './$types';
import {
	getMailboxConnectionStatus,
	getMailboxSignature
} from '$lib/server/repositories/user-mailbox-credentials';
import { normalizeMailboxSignature } from '$lib/shared/mailbox/signature';

export const load: LayoutServerLoad = async ({ locals }) => {
	const connection = await getMailboxConnectionStatus(locals.user!.id);
	const configured = connection.connected;
	const signature = configured
		? normalizeMailboxSignature(await getMailboxSignature(locals.user!.id))
		: null;

	return {
		connection,
		configured,
		signature
	};
};
