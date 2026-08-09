import {
	getMailProvider,
	getPostmarkConfig,
	getSmtpConfig
} from '$lib/server/mail/config';
import { createPostmarkTransport } from '$lib/server/mail/transports/postmark';
import { createSmtpTransport } from '$lib/server/mail/transports/smtp';
import type { MailMessage, MailTransport } from '$lib/server/mail/types';

let transportPromise: Promise<MailTransport | null> | null = null;

function createTransport(): MailTransport | null {
	const provider = getMailProvider();

	if (provider === 'postmark') {
		const config = getPostmarkConfig();
		return config ? createPostmarkTransport(config) : null;
	}

	const config = getSmtpConfig();
	return config ? createSmtpTransport(config) : null;
}

async function getTransport(): Promise<MailTransport | null> {
	if (transportPromise) {
		const existing = await transportPromise;
		if (existing) {
			return existing;
		}
		transportPromise = null;
	}

	const transport = createTransport();

	if (transport) {
		transportPromise = Promise.resolve(transport);
	}

	return transport;
}

export async function sendMail(message: MailMessage): Promise<void> {
	const transport = await getTransport();

	if (!transport) {
		throw new Error('Mail transport is not configured');
	}

	await transport.send(message);
}

export async function isMailConfigured(): Promise<boolean> {
	return (await getTransport()) !== null;
}
