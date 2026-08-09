import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getMailboxConnectionStatus,
	upsertMailboxSignature
} from '$lib/server/repositories/user-mailbox-credentials';
import { MAILBOX_SIGNATURE_SCHEMA } from '$lib/shared/mailbox/signature';
import { isMailboxSignatureConfigured } from '$lib/shared/mailbox/signature';

export const load: PageServerLoad = async () => ({
	meta: {
		title: 'Email signature'
	}
});

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const connection = await getMailboxConnectionStatus(locals.user!.id);
		if (!connection.connected) {
			return fail(400, {
				signatureError: 'Connect your mailbox before saving a signature.'
			});
		}

		const formData = await request.formData();
		const parsed = MAILBOX_SIGNATURE_SCHEMA.safeParse({
			includeByDefault: formData.get('includeByDefault') === 'on',
			name: String(formData.get('name') ?? ''),
			position: String(formData.get('position') ?? ''),
			email: String(formData.get('email') ?? ''),
			companyName: String(formData.get('companyName') ?? ''),
			logoUrl: String(formData.get('logoUrl') ?? ''),
			phone: String(formData.get('phone') ?? ''),
			address: String(formData.get('address') ?? '')
		});

		if (!parsed.success) {
			return fail(400, {
				signatureError: 'Check the email and logo URL fields.'
			});
		}

		if (!isMailboxSignatureConfigured(parsed.data)) {
			return fail(400, {
				signatureError: 'Add at least a name, email, company, or contact detail for your signature.'
			});
		}

		try {
			await upsertMailboxSignature(locals.user!.id, parsed.data);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Could not save your email signature.';
			return fail(500, { signatureError: message });
		}

		return { signatureSaved: true };
	}
};
