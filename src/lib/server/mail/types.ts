export type MailMessage = {
	to: string;
	subject: string;
	text: string;
	html: string;
};

export type MailTransport = {
	send(message: MailMessage): Promise<void>;
};
