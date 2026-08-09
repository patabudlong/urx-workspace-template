import { escapeMailboxHtml } from '$lib/mailbox/utils';
import type { MailboxSignature } from '$lib/shared/mailbox/signature';
import { isMailboxSignatureConfigured } from '$lib/shared/mailbox/signature';

function formatWebsiteLabel(url: string): string {
	return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function buildMailboxSignatureText(signature: MailboxSignature): string {
	const lines: string[] = [];

	if (signature.name.trim()) {
		lines.push(signature.name.trim());
	}
	if (signature.position.trim()) {
		lines.push(signature.position.trim());
	}
	if (signature.companyName.trim()) {
		lines.push(signature.companyName.trim());
	}

	const contacts: string[] = [];
	if (signature.email.trim()) {
		contacts.push(signature.email.trim());
	}
	if (signature.phone.trim()) {
		contacts.push(signature.phone.trim());
	}
	if (signature.website.trim()) {
		contacts.push(signature.website.trim());
	}
	if (contacts.length > 0) {
		lines.push(contacts.join(' · '));
	}
	if (signature.address.trim()) {
		lines.push(signature.address.trim());
	}

	return lines.join('\n');
}

export function buildMailboxSignatureHtml(signature: MailboxSignature): string {
	const name = escapeMailboxHtml(signature.name.trim());
	const position = escapeMailboxHtml(signature.position.trim());
	const company = escapeMailboxHtml(signature.companyName.trim());
	const email = escapeMailboxHtml(signature.email.trim());
	const phone = escapeMailboxHtml(signature.phone.trim());
	const website = signature.website.trim();
	const address = escapeMailboxHtml(signature.address.trim());
	const logoUrl = signature.logoUrl.trim();

	const contactParts: string[] = [];
	if (email) {
		contactParts.push(
			`<a href="mailto:${email}" style="color:#2563eb;text-decoration:underline">${email}</a>`
		);
	}
	if (phone) {
		contactParts.push(`<span>${phone}</span>`);
	}
	if (website) {
		const href = escapeMailboxHtml(website);
		contactParts.push(
			`<a href="${href}" style="color:#2563eb;text-decoration:underline">${escapeMailboxHtml(formatWebsiteLabel(website))}</a>`
		);
	}

	const textBlock = [
		name ? `<p style="margin:0;font-size:15px;font-weight:600;color:#18181b">${name}</p>` : '',
		position ? `<p style="margin:2px 0 0;font-size:14px;color:#52525b">${position}</p>` : '',
		company ? `<p style="margin:2px 0 0;font-size:14px;color:#52525b">${company}</p>` : '',
		contactParts.length > 0
			? `<p style="margin:8px 0 0;font-size:14px;color:#3f3f46">${contactParts.join(' <span style="color:#d4d4d8">|</span> ')}</p>`
			: '',
		address ? `<p style="margin:4px 0 0;font-size:13px;color:#71717a">${address}</p>` : ''
	]
		.filter(Boolean)
		.join('');

	if (!textBlock && !logoUrl) {
		return '';
	}

	const logoCell = logoUrl
		? `<td style="padding-right:16px;vertical-align:top"><img src="${escapeMailboxHtml(logoUrl)}" alt="${company || 'Company logo'}" height="48" style="display:block;max-width:120px;height:auto;max-height:48px" /></td>`
		: '';

	const divider = logoUrl ? 'border-left:2px solid #e4e4e7;padding-left:16px;' : '';

	return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.5;color:#18181b"><tr>${logoCell}<td style="vertical-align:top;${divider}">${textBlock}</td></tr></table>`;
}

export function appendMailboxSignatureToBodies(input: {
	plainMessage: string;
	htmlMessage: string;
	quotedText: string;
	quotedHtml: string;
	signature: MailboxSignature | null;
	includeSignature: boolean;
}): { text: string; html: string } {
	const {
		plainMessage,
		htmlMessage,
		quotedText,
		quotedHtml,
		signature,
		includeSignature
	} = input;

	const signatureText =
		includeSignature && signature && isMailboxSignatureConfigured(signature)
			? buildMailboxSignatureText(signature)
			: '';
	const signatureHtml =
		includeSignature && signature && isMailboxSignatureConfigured(signature)
			? buildMailboxSignatureHtml(signature)
			: '';

	const hasUserContent = plainMessage.trim().length > 0;

	if (!hasUserContent) {
		return {
			text: quotedText.trim(),
			html: quotedHtml
		};
	}

	const textParts = [plainMessage];
	if (signatureText) {
		textParts.push('', '--', signatureText);
	}
	textParts.push(quotedText);

	const htmlParts = [htmlMessage];
	if (signatureHtml) {
		htmlParts.push(`<br><br>${signatureHtml}`);
	}
	if (quotedHtml) {
		htmlParts.push(`<br>${quotedHtml}`);
	}

	return {
		text: textParts.join('\n'),
		html: htmlParts.join('')
	};
}
