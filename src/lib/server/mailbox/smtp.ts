import nodemailer from 'nodemailer';
import { getMailboxConfig } from './config';
import type { MailboxSendMessageInput } from '$lib/shared/mailbox/schemas';

export async function sendMailboxMessage(
	userId: string,
	input: MailboxSendMessageInput
): Promise<{ messageId: string | null }> {
	const config = await getMailboxConfig(userId);
	if (!config) {
		throw new Error('Mailbox is not configured');
	}

	const transport = nodemailer.createTransport({
		host: config.smtp.host,
		port: config.smtp.port,
		secure: config.smtp.secure,
		auth: {
			user: config.email,
			pass: config.password
		}
	});

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
		text: input.text,
		html: input.html
	});

	return { messageId: info.messageId ?? null };
}
