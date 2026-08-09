import type { LayoutServerLoad } from './$types';
import { getDefaultMailboxHosts } from '$lib/server/mailbox';
import {
	getMailboxConnectionStatus,
	getMailboxSignature
} from '$lib/server/repositories/user-mailbox-credentials';
import { EMPTY_MAILBOX_SIGNATURE, normalizeMailboxSignature } from '$lib/shared/mailbox/signature';
import { PRIVATEEMAIL_SERVER_DEFAULTS } from '$lib/shared/mailbox/privateemail';

export const load: LayoutServerLoad = async ({ locals }) => {
	const connection = await getMailboxConnectionStatus(locals.user!.id);
	const serverDefaults = getDefaultMailboxHosts();
	const signature = normalizeMailboxSignature(
		(await getMailboxSignature(locals.user!.id)) ?? {
			...EMPTY_MAILBOX_SIGNATURE,
			name: connection.displayName ?? '',
			email: connection.email ?? ''
		}
	);

	return {
		connection,
		signature,
		serverDefaults,
		privateEmailReference: PRIVATEEMAIL_SERVER_DEFAULTS
	};
};
