import { sendMail } from '$lib/server/mail/index';
import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
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
	const platformOrigin = resolvePlatformWorkspaceOrigin(input.origin);
	const content = {
		greeting,
		resetUrl: input.resetUrl,
		logoUrl: `${platformOrigin}/email/urixoft-logo.png`,
		illustrationUrl: `${platformOrigin}/email/forgot-password.png`
	};

	await sendMail({
		to: input.to,
		subject: 'Reset your Urixoft Workspace password',
		text: buildPasswordResetEmailText(content),
		html: buildPasswordResetEmailHtml(content)
	});
}
