import { sendMail } from '$lib/server/mail/index';
import {
	buildPasswordResetEmailHtml,
	buildPasswordResetEmailText
} from '$lib/server/mail/templates/password-reset';

export async function sendPasswordResetEmail(input: {
	to: string;
	firstName: string;
	resetUrl: string;
	origin: string;
}): Promise<void> {
	const greeting = input.firstName.trim() || 'there';
	const content = {
		greeting,
		resetUrl: input.resetUrl,
		logoUrl: `${input.origin}/email/urixoft-logo.png`,
		illustrationUrl: `${input.origin}/email/forgot-password.png`
	};

	await sendMail({
		to: input.to,
		subject: 'Reset your Urixoft Workspace password',
		text: buildPasswordResetEmailText(content),
		html: buildPasswordResetEmailHtml(content)
	});
}
