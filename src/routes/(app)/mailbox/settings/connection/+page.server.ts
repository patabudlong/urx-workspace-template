import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	buildMailboxConfigFromConnect,
	invalidateMailboxImapSession,
	verifyMailboxCredentials
} from '$lib/server/mailbox';
import {
	deleteMailboxCredentialsForUser,
	upsertMailboxCredentialsForUser
} from '$lib/server/repositories/user-mailbox-credentials';
import { MAILBOX_CONNECT_SCHEMA } from '$lib/shared/mailbox/schemas';

export const load: PageServerLoad = async () => ({
	meta: {
		title: 'Mailbox connection'
	}
});

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
			await invalidateMailboxImapSession(locals.user!.id);
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
		await invalidateMailboxImapSession(locals.user!.id);
		await deleteMailboxCredentialsForUser(locals.user!.id);
		return { disconnected: true };
	}
};
