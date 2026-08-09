import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buildMailboxConfigFromConnect, getDefaultMailboxHosts, verifyMailboxCredentials } from '$lib/server/mailbox';
import {
	deleteMailboxCredentialsForUser,
	getMailboxConnectionStatus,
	upsertMailboxCredentialsForUser
} from '$lib/server/repositories/user-mailbox-credentials';
import { MAILBOX_CONNECT_SCHEMA } from '$lib/shared/mailbox/schemas';
import { PRIVATEEMAIL_SERVER_DEFAULTS } from '$lib/shared/mailbox/privateemail';

export const load: PageServerLoad = async ({ locals }) => {
	const connection = await getMailboxConnectionStatus(locals.user!.id);
	const serverDefaults = getDefaultMailboxHosts();

	return {
		connection,
		serverDefaults,
		privateEmailReference: PRIVATEEMAIL_SERVER_DEFAULTS,
		meta: {
			title: 'Mailbox settings'
		}
	};
};

export const actions: Actions = {
	connect: async ({ locals, request }) => {
		const formData = await request.formData();
		const payload = {
			email: String(formData.get('email') ?? ''),
			password: String(formData.get('password') ?? ''),
			displayName: String(formData.get('displayName') ?? '') || undefined
		};

		const parsed = MAILBOX_CONNECT_SCHEMA.safeParse(payload);
		if (!parsed.success) {
			return fail(400, {
				error: 'Enter a valid email address and password.'
			});
		}

		const config = buildMailboxConfigFromConnect(parsed.data);
		const verification = await verifyMailboxCredentials(config);
		if (!verification.ok) {
			return fail(400, { error: verification.message });
		}

		try {
			await upsertMailboxCredentialsForUser(locals.user!.id, verification.config);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Could not save mailbox credentials. Check database connectivity.';
			return fail(500, { error: message });
		}

		return { success: true };
	},
	disconnect: async ({ locals }) => {
		await deleteMailboxCredentialsForUser(locals.user!.id);
		return { disconnected: true };
	}
};
