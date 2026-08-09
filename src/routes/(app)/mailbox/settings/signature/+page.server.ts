import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getMailboxConnectionStatus,
	upsertMailboxSignature
} from '$lib/server/repositories/user-mailbox-credentials';
import { MAILBOX_SIGNATURE_SCHEMA, normalizeMailboxSignature, isMailboxSignatureConfigured } from '$lib/shared/mailbox/signature';

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
			mobile: String(formData.get('mobile') ?? ''),
			address: String(formData.get('address') ?? '')
		});

		if (!parsed.success) {
			return fail(400, {
				signatureError: 'Check the email and logo URL fields.'
			});
		}

		const signature = normalizeMailboxSignature(parsed.data);

		if (!isMailboxSignatureConfigured(signature)) {
			return fail(400, {
				signatureError: 'Add at least a name, email, company, or contact detail for your signature.'
			});
		}

		try {
			await upsertMailboxSignature(locals.user!.id, signature);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Could not save your email signature.';
			return fail(500, { signatureError: message });
		}

		return { signatureSaved: true };
	}
};
