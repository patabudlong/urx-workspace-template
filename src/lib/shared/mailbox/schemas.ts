import { z } from 'zod';

export const MAILBOX_FOLDER_PATH_SCHEMA = z.string().min(1).max(256);

export const MAILBOX_LIST_MESSAGES_QUERY_SCHEMA = z.object({
	folder: MAILBOX_FOLDER_PATH_SCHEMA.default('INBOX'),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(25)
});

export const MAILBOX_MESSAGE_UID_PARAM_SCHEMA = z.object({
	uid: z.coerce.number().int().positive()
});

export const MAILBOX_SEND_MESSAGE_SCHEMA = z.object({
	to: z.array(z.email()).min(1).max(50),
	cc: z.array(z.email()).max(50).optional(),
	bcc: z.array(z.email()).max(50).optional(),
	subject: z.string().trim().min(1).max(998),
	text: z.string().trim().min(1).max(100_000),
	html: z.string().trim().max(200_000).optional(),
	replyTo: z.email().optional()
});

export const MAILBOX_CONNECT_SCHEMA = z.object({
	email: z.email(),
	password: z.string().min(1).max(256),
	displayName: z.string().trim().max(120).optional(),
	imapHost: z.string().trim().min(1).max(253).optional(),
	imapPort: z.coerce.number().int().min(1).max(65535).optional(),
	imapSecure: z.boolean().optional(),
	smtpHost: z.string().trim().min(1).max(253).optional(),
	smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
	smtpSecure: z.boolean().optional()
});

export type MailboxFolder = {
	path: string;
	name: string;
	specialUse: string | null;
	unseen: number;
	total: number;
};

export type MailboxMessageSummary = {
	uid: number;
	subject: string;
	from: string;
	to: string[];
	date: string;
	seen: boolean;
	answered: boolean;
	flagged: boolean;
	hasAttachments: boolean;
	preview: string;
};

export type MailboxMessageDetail = MailboxMessageSummary & {
	cc: string[];
	bcc: string[];
	messageId: string | null;
	inReplyTo: string | null;
	text: string;
	html: string | null;
};

export type MailboxSendMessageInput = z.infer<typeof MAILBOX_SEND_MESSAGE_SCHEMA>;
export type MailboxConnectInput = z.infer<typeof MAILBOX_CONNECT_SCHEMA>;
