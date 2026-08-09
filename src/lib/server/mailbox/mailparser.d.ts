declare module 'mailparser' {
	export type MailparserAttachment = {
		contentId?: string;
		cid?: string;
		contentType?: string;
		content: Buffer;
	};

	export function simpleParser(source: Buffer | NodeJS.ReadableStream | string): Promise<{
		messageId?: string;
		inReplyTo?: string;
		text?: string;
		textAsHtml?: string;
		html?: string | false;
		attachments?: MailparserAttachment[];
	}>;
}
