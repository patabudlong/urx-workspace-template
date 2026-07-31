import { env } from '$env/dynamic/private';

export type MailProvider = 'smtp' | 'postmark';

export function getMailProvider(): MailProvider {
	const value = env.MAIL_PROVIDER?.trim().toLowerCase();

	if (value === 'postmark') {
		return 'postmark';
	}

	return 'smtp';
}

export function getSmtpConfig() {
	const host = env.SMTP_HOST?.trim();
	const port = Number(env.SMTP_PORT ?? '587');
	const from = env.SMTP_FROM?.trim();

	if (!host || !from || Number.isNaN(port)) {
		return null;
	}

	return { host, port, from };
}

export function getPostmarkConfig() {
	const serverToken = env.POSTMARK_SERVER_TOKEN?.trim();
	const from = env.SMTP_FROM?.trim();

	if (!serverToken || !from) {
		return null;
	}

	return { serverToken, from };
}
