declare module 'mailparser' {
	export function simpleParser(source: Buffer | NodeJS.ReadableStream | string): Promise<{
		messageId?: string;
		inReplyTo?: string;
		text?: string;
		textAsHtml?: string;
		html?: string | false;
	}>;
}
