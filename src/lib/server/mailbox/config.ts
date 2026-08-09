import { env } from '$env/dynamic/private';
import { getMailboxConfigForUser } from '$lib/server/repositories/user-mailbox-credentials';
import type { MailboxConnectInput } from '$lib/shared/mailbox/schemas';

export type MailboxConfig = {
	imap: {
		host: string;
		port: number;
		secure: boolean;
	};
	smtp: {
		host: string;
		port: number;
		secure: boolean;
	};
	email: string;
	password: string;
	displayName: string;
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
	if (value === undefined || value === '') {
		return fallback;
	}

	return value === 'true' || value === '1';
}

function parsePort(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getDefaultMailboxHosts() {
	return {
		imap: {
			host: env.MAILBOX_IMAP_HOST?.trim() || 'mail.privateemail.com',
			port: parsePort(env.MAILBOX_IMAP_PORT, 993),
			secure: parseBoolean(env.MAILBOX_IMAP_SECURE, true)
		},
		smtp: {
			host: env.MAILBOX_SMTP_HOST?.trim() || 'mail.privateemail.com',
			port: parsePort(env.MAILBOX_SMTP_PORT, 465),
			secure: parseBoolean(env.MAILBOX_SMTP_SECURE, true)
		}
	};
}

export function buildMailboxConfigFromConnect(input: MailboxConnectInput): MailboxConfig {
	const defaults = getDefaultMailboxHosts();

	return {
		imap: {
			host: input.imapHost?.trim() || defaults.imap.host,
			port: input.imapPort ?? defaults.imap.port,
			secure: input.imapSecure ?? defaults.imap.secure
		},
		smtp: {
			host: input.smtpHost?.trim() || defaults.smtp.host,
			port: input.smtpPort ?? defaults.smtp.port,
			secure: input.smtpSecure ?? defaults.smtp.secure
		},
		email: input.email.trim(),
		password: input.password,
		displayName: input.displayName?.trim() || input.email.trim()
	};
}

export async function getMailboxConfig(userId: string): Promise<MailboxConfig | null> {
	return getMailboxConfigForUser(userId);
}

export async function isMailboxConfigured(userId: string): Promise<boolean> {
	const config = await getMailboxConfig(userId);
	return config !== null;
}
