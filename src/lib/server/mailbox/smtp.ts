import nodemailer from 'nodemailer';
import { getMailboxConfig } from './config';
import { appendMailboxSentMessage } from './imap';
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

	const bodyHtml = input.html?.trim() || plainTextToMailboxBodyHtml(input.text);
	const html = buildMailboxOutboundEmailHtml({
		subject: input.subject,
		bodyHtml,
		requestOrigin: options.requestOrigin
	});
	const text = buildMailboxOutboundEmailText(input.text);
	const mailOptions = {
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
	};

	const streamTransport = nodemailer.createTransport({
		streamTransport: true,
		buffer: true,
		newline: 'unix'
	});
	const compiled = await streamTransport.sendMail(mailOptions);
	const rawMessage = compiled.message;
	if (!Buffer.isBuffer(rawMessage)) {
		throw new Error('Failed to compile outbound message');
	}

	const transport = createSmtpTransport(config);
	const info = await transport.sendMail({
		envelope: compiled.envelope,
		raw: rawMessage
	});

	try {
		await appendMailboxSentMessage(userId, rawMessage);
	} catch {
		// Delivery already succeeded; a missing Sent copy should not fail the send.
	}

	return { messageId: info.messageId ?? compiled.messageId ?? null };
}
