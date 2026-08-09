import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import {
	buildTransactionalEmailHtml,
	buildTransactionalEmailText,
	escapeHtml,
	TEXT_BODY
} from '$lib/server/mail/templates/transactional-email-layout';

export type MailboxOutboundEmailInput = {
	subject: string;
	bodyHtml: string;
	requestOrigin: string;
};

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
	const platformOrigin = resolvePlatformWorkspaceOrigin(input.requestOrigin);
	const subject = input.subject.trim();

	return buildTransactionalEmailHtml({
		preheader: subject,
		documentTitle: subject,
		logoUrl: `${platformOrigin}/email/urixoft-logo.png`,
		headline: subject,
		bodyHtml: wrapMailboxBodyHtml(input.bodyHtml),
		illustrationUrl: `${platformOrigin}/email/messages.png`,
		illustrationAlt: 'Messages illustration'
	});
}

export function buildMailboxOutboundEmailText(subject: string, bodyText: string): string {
	return buildTransactionalEmailText([subject, '', bodyText]);
}
