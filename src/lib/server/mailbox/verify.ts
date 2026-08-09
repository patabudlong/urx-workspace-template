import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import type { MailboxConfig } from './config';

export async function verifyMailboxCredentials(
	config: MailboxConfig
): Promise<{ ok: boolean; message: string }> {
	const imapClient = new ImapFlow({
		host: config.imap.host,
		port: config.imap.port,
		secure: config.imap.secure,
		auth: {
			user: config.email,
			pass: config.password
		},
		logger: false
	});

	try {
		await imapClient.connect();
		await imapClient.status('INBOX', { messages: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'IMAP connection failed';
		return { ok: false, message };
	} finally {
		await imapClient.logout().catch(() => undefined);
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

	try {
		await transport.verify();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'SMTP connection failed';
		return { ok: false, message };
	}

	return { ok: true, message: 'Mailbox connection successful' };
}
