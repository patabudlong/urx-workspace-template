import { getMailboxConfig } from './config';
import { createSmtpTransport } from './verify';
import {
	buildMailboxOutboundEmailHtml,
	buildMailboxOutboundEmailText,
	plainTextToMailboxBodyHtml
} from '$lib/server/mail/templates/mailbox-outbound-email';
import type { MailboxSendMessageInput } from '$lib/shared/mailbox/schemas';

export type SendMailboxMessageOptions = {
	requestOrigin: string;
};

export async function sendMailboxMessage(
	userId: string,
	input: MailboxSendMessageInput,
	options: SendMailboxMessageOptions
): Promise<{ messageId: string | null }> {
	const config = await getMailboxConfig(userId);
	if (!config) {
		throw new Error('Mailbox is not configured');
	}

	const transport = createSmtpTransport(config);
	const bodyHtml = input.html?.trim() || plainTextToMailboxBodyHtml(input.text);
	const html = buildMailboxOutboundEmailHtml({
		subject: input.subject,
		bodyHtml,
		requestOrigin: options.requestOrigin
	});
	const text = buildMailboxOutboundEmailText(input.text);

	const info = await transport.sendMail({
		from: {
			name: config.displayName,
			address: config.email
		},
		to: input.to,
		cc: input.cc,
		bcc: input.bcc,
		replyTo: input.replyTo,
		subject: input.subject,
		text,
		html
	});

	return { messageId: info.messageId ?? null };
}
