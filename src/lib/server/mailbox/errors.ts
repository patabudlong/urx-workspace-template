type MailServiceError = {
	message?: string;
	response?: string;
	serverResponseCode?: string;
	authenticationFailed?: boolean;
	code?: string;
};

export function formatImapError(error: unknown): string {
	if (!error || typeof error !== 'object') {
		return 'IMAP connection failed. Check your PrivateEmail email and mailbox password.';
	}

	const err = error as MailServiceError;

	if (err.authenticationFailed || err.serverResponseCode === 'AUTHENTICATIONFAILED') {
		return 'IMAP authentication failed. Use your full email address (you@yourdomain.com) and your PrivateEmail mailbox password — not your Namecheap account password.';
	}

	if (err.response) {
		return `IMAP error: ${err.response}`;
	}

	if (err.message && err.message !== 'Command failed') {
		return `IMAP error: ${err.message}`;
	}

	return 'IMAP connection failed. Confirm IMAP access is enabled for your PrivateEmail mailbox.';
}

export function formatSmtpError(error: unknown): string {
	if (!error || typeof error !== 'object') {
		return 'SMTP connection failed. Check your PrivateEmail email and mailbox password.';
	}

	const err = error as MailServiceError;

	if (err.code === 'EAUTH' || err.response?.includes('Authentication failed')) {
		return 'SMTP authentication failed. Use your full email address and PrivateEmail mailbox password.';
	}

	if (err.response) {
		return `SMTP error: ${err.response}`;
	}

	if (err.message) {
		return `SMTP error: ${err.message}`;
	}

	return 'SMTP connection failed.';
}
