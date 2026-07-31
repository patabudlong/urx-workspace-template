import nodemailer from 'nodemailer';
import type { MailMessage, MailTransport } from '$lib/server/mail/types';

export function createSmtpTransport(config: {
	host: string;
	port: number;
	from: string;
}): MailTransport {
	const transporter = nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.port === 465,
		ignoreTLS: config.port === 1025
	});

	return {
		async send(message: MailMessage) {
			await transporter.sendMail({
				from: config.from,
				to: message.to,
				subject: message.subject,
				text: message.text,
				html: message.html
			});
		}
	};
}
