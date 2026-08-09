import { z } from 'zod';

const optionalUrl = z.union([z.literal(''), z.string().trim().url()]);

export const MAILBOX_SIGNATURE_SCHEMA = z.object({
	includeByDefault: z.coerce.boolean().default(true),
	name: z.string().trim().max(120).default(''),
	position: z.string().trim().max(120).default(''),
	email: z.union([z.literal(''), z.email()]).default(''),
	companyName: z.string().trim().max(120).default(''),
	logoUrl: optionalUrl.default(''),
	phone: z.string().trim().max(40).default(''),
	mobile: z.string().trim().max(40).default(''),
	address: z.string().trim().max(200).default('')
});

export type MailboxSignature = z.infer<typeof MAILBOX_SIGNATURE_SCHEMA>;

export const EMPTY_MAILBOX_SIGNATURE: MailboxSignature = {
	includeByDefault: true,
	name: '',
	position: '',
	email: '',
	companyName: '',
	logoUrl: '',
	phone: '',
	mobile: '',
	address: ''
};

export function normalizeMailboxSignature(
	signature: Partial<MailboxSignature> | null | undefined
): MailboxSignature {
	return {
		...EMPTY_MAILBOX_SIGNATURE,
		...signature,
		includeByDefault: signature?.includeByDefault ?? true
	};
}

export function isMailboxSignatureConfigured(
	signature: Partial<MailboxSignature> | null | undefined
): boolean {
	if (!signature) {
		return false;
	}

	return !!(
		signature.name?.trim() ||
		signature.position?.trim() ||
		signature.email?.trim() ||
		signature.companyName?.trim() ||
		signature.logoUrl?.trim() ||
		signature.phone?.trim() ||
		signature.mobile?.trim() ||
		signature.address?.trim()
	);
}
