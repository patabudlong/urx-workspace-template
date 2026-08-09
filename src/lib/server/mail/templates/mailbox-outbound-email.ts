import { EMAIL_ASSETS, resolveEmailAssetUrl, resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
import {
	buildTransactionalEmailHtml,
	buildTransactionalEmailText,
	escapeHtml,
	SENT_VIA_URIXOFT_WORKSPACE_TEXT,
	TEXT_BODY
} from '$lib/server/mail/templates/transactional-email-layout';

export type MailboxOutboundEmailInput = {
	subject: string;
	bodyHtml: string;
	requestOrigin: string;
};

function stripHtmlToPlainText(html: string): string {
	return html
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function buildMailboxPreheader(bodyHtml: string, subject: string): string {
	const plain = stripHtmlToPlainText(bodyHtml);
	return plain.slice(0, 120) || subject;
}

function wrapMailboxBodyHtml(bodyHtml: string): string {
	return [
		'<div style="font-family:Arial,Helvetica,sans-serif;',
		'font-size:14px;line-height:22px;',
		`color:${TEXT_BODY};">`,
		bodyHtml,
		'</div>'
	].join('');
}

export function plainTextToMailboxBodyHtml(text: string): string {
	return escapeHtml(text).replaceAll('\n', '<br>');
}

export function buildMailboxOutboundEmailHtml(input: MailboxOutboundEmailInput): string {
	const subject = input.subject.trim();

	return buildTransactionalEmailHtml({
		preheader: buildMailboxPreheader(input.bodyHtml, subject),
		documentTitle: subject,
		logoUrl: resolveEmailLogoUrl(input.requestOrigin),
		bodyHtml: wrapMailboxBodyHtml(input.bodyHtml),
		illustrationUrl: resolveEmailAssetUrl(EMAIL_ASSETS.messages, input.requestOrigin),
		illustrationAlt: 'Messages illustration',
		sentViaInCard: true
	});
}

export function buildMailboxOutboundEmailText(bodyText: string): string {
	return buildTransactionalEmailText([bodyText, '', SENT_VIA_URIXOFT_WORKSPACE_TEXT]);
}
