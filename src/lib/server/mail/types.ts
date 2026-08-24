export type MailAttachment = {
	filename: string;
	content: Buffer;
	contentType: string;
	cid?: string;
};

export type MailMessage = {
	to: string;
	from?: string;
	subject: string;
	text: string;
	html: string;
	attachments?: MailAttachment[];
};

export type MailTransport = {
	send(message: MailMessage): Promise<void>;
};
