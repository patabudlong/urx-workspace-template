import { env } from '$env/dynamic/private';
import { getMailboxConfigForUser } from '$lib/server/repositories/user-mailbox-credentials';
import type { MailboxConnectInput } from '$lib/shared/mailbox/schemas';
import { PRIVATEEMAIL_SERVER_DEFAULTS } from '$lib/shared/mailbox/privateemail';

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

function resolveSmtpSettings(port: number, secureOverride?: boolean) {
	if (secureOverride !== undefined) {
		return { port, secure: secureOverride };
	}

	if (port === 587) {
		return { port: 587, secure: false };
	}

	return { port, secure: true };
}

export function getDefaultMailboxHosts() {
	const smtpPort = parsePort(env.MAILBOX_SMTP_PORT, PRIVATEEMAIL_SERVER_DEFAULTS.smtp.preferredPort);
	const smtpSecure = env.MAILBOX_SMTP_SECURE
		? parseBoolean(env.MAILBOX_SMTP_SECURE, true)
		: undefined;

	return {
		imap: {
			host: env.MAILBOX_IMAP_HOST?.trim() || PRIVATEEMAIL_SERVER_DEFAULTS.imap.host,
			port: parsePort(env.MAILBOX_IMAP_PORT, PRIVATEEMAIL_SERVER_DEFAULTS.imap.port),
			secure: parseBoolean(env.MAILBOX_IMAP_SECURE, PRIVATEEMAIL_SERVER_DEFAULTS.imap.secure)
		},
		smtp: {
			host: env.MAILBOX_SMTP_HOST?.trim() || PRIVATEEMAIL_SERVER_DEFAULTS.smtp.host,
			...resolveSmtpSettings(smtpPort, smtpSecure)
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
			...resolveSmtpSettings(input.smtpPort ?? defaults.smtp.port, input.smtpSecure)
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
