export const PRIVATEEMAIL_SERVER_DEFAULTS = {
	imap: {
		host: 'mail.privateemail.com',
		port: 993,
		secure: true,
		encryption: 'SSL'
	},
	smtp: {
		host: 'mail.privateemail.com',
		ports: [
			{ port: 465, secure: true, encryption: 'SSL' },
			{ port: 587, secure: false, encryption: 'SSL/TLS (STARTTLS)' }
		] as const,
		preferredPort: 465
	}
} as const;

export type MailboxServerDefaults = {
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
};
