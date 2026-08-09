import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buildMailboxConfigFromConnect, verifyMailboxCredentials } from '$lib/server/mailbox';
import {
	deleteMailboxCredentialsForUser,
	getMailboxConnectionStatus,
	upsertMailboxCredentialsForUser
} from '$lib/server/repositories/user-mailbox-credentials';
import { MAILBOX_CONNECT_SCHEMA } from '$lib/shared/mailbox/schemas';

export const load: PageServerLoad = async ({ locals }) => {
	const connection = await getMailboxConnectionStatus(locals.user!.id);

	return {
		connection,
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

		await upsertMailboxCredentialsForUser(locals.user!.id, config);
		return { success: true };
	},
	disconnect: async ({ locals }) => {
		await deleteMailboxCredentialsForUser(locals.user!.id);
		return { disconnected: true };
	}
};
