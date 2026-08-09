import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isMailboxConfigured, sendMailboxMessage } from '$lib/server/mailbox';
import { MAILBOX_SEND_MESSAGE_SCHEMA } from '$lib/shared/mailbox/schemas';
import { parseRecipientInput } from '$lib/mailbox/utils';

export const load: PageServerLoad = async ({ locals }) => {
	if (!(await isMailboxConfigured(locals.user!.id))) {
		redirect(303, '/mailbox/settings');
	}

	return {
		configured: true
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!(await isMailboxConfigured(locals.user!.id))) {
			return fail(503, { error: 'Mailbox is not connected' });
		}

		const formData = await request.formData();
		const payload = {
			to: parseRecipientInput(String(formData.get('to') ?? '')),
			cc: parseRecipientInput(String(formData.get('cc') ?? '')),
			subject: String(formData.get('subject') ?? ''),
			text: String(formData.get('text') ?? '')
		};

		const parsed = MAILBOX_SEND_MESSAGE_SCHEMA.safeParse({
			...payload,
			cc: payload.cc.length > 0 ? payload.cc : undefined
		});

		if (!parsed.success) {
			return fail(400, {
				error: 'Please check the recipient addresses, subject, and message body.'
			});
		}

		try {
			await sendMailboxMessage(locals.user!.id, parsed.data);
			return { success: true };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to send message';
			return fail(500, { error: message });
		}
	}
};
