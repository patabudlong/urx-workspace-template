import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import type { MailboxConfig } from './config';
import { formatImapError, formatSmtpError } from './errors';

const MAIL_TIMEOUT_MS = 20_000;

export type MailboxVerifyResult =
	| { ok: true; message: string; config: MailboxConfig }
	| { ok: false; message: string };

function createImapClient(config: MailboxConfig): ImapFlow {
	return new ImapFlow({
		host: config.imap.host,
		port: config.imap.port,
		secure: config.imap.secure,
		auth: {
			user: config.email,
			pass: config.password
		},
		logger: false,
		tls: { minVersion: 'TLSv1.2' },
		connectionTimeout: MAIL_TIMEOUT_MS,
		greetingTimeout: MAIL_TIMEOUT_MS,
		// ImapFlow defaults to 5 minutes — a stuck LIST/STATUS would look like an endless nav load.
		socketTimeout: MAIL_TIMEOUT_MS
	});
}

function getSmtpCandidates(config: MailboxConfig) {
	const candidates = [config.smtp];

	if (config.smtp.port !== 465) {
		candidates.push({
			host: config.smtp.host,
			port: 465,
			secure: true
		});
	}

	if (config.smtp.port !== 587) {
		candidates.push({
			host: config.smtp.host,
			port: 587,
			secure: false
		});
	}

	return candidates;
}

async function verifyImap(config: MailboxConfig): Promise<{ ok: true } | { ok: false; message: string }> {
	const imapClient = createImapClient(config);

	try {
		await imapClient.connect();
		const lock = await imapClient.getMailboxLock('INBOX');
		lock.release();
		return { ok: true };
	} catch (error) {
		return { ok: false, message: formatImapError(error) };
	} finally {
		await imapClient.logout().catch(() => undefined);
	}
}

async function verifySmtp(
	config: MailboxConfig
): Promise<{ ok: true; smtp: MailboxConfig['smtp'] } | { ok: false; message: string }> {
	const candidates = getSmtpCandidates(config);
	let lastError: string | null = null;

	for (const smtp of candidates) {
		const transport = nodemailer.createTransport({
			host: smtp.host,
			port: smtp.port,
			secure: smtp.secure,
			requireTLS: !smtp.secure && smtp.port === 587,
			auth: {
				user: config.email,
				pass: config.password
			},
			tls: { minVersion: 'TLSv1.2' },
			connectionTimeout: MAIL_TIMEOUT_MS,
			greetingTimeout: MAIL_TIMEOUT_MS
		});

		try {
			await transport.verify();
			return { ok: true, smtp };
		} catch (error) {
			lastError = formatSmtpError(error);
		} finally {
			transport.close();
		}
	}

	return { ok: false, message: lastError ?? 'SMTP connection failed.' };
}

export async function verifyMailboxCredentials(config: MailboxConfig): Promise<MailboxVerifyResult> {
	const imapResult = await verifyImap(config);
	if (!imapResult.ok) {
		return imapResult;
	}

	const smtpResult = await verifySmtp(config);
	if (!smtpResult.ok) {
		return smtpResult;
	}

	return {
		ok: true,
		message: 'Mailbox connection successful',
		config: {
			...config,
			smtp: smtpResult.smtp
		}
	};
}

export { createImapClient };

export function createSmtpTransport(config: MailboxConfig) {
	return nodemailer.createTransport({
		host: config.smtp.host,
		port: config.smtp.port,
		secure: config.smtp.secure,
		requireTLS: !config.smtp.secure && config.smtp.port === 587,
		auth: {
			user: config.email,
			pass: config.password
		},
		tls: { minVersion: 'TLSv1.2' },
		connectionTimeout: MAIL_TIMEOUT_MS,
		greetingTimeout: MAIL_TIMEOUT_MS
	});
}
