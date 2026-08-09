import { sendMail } from '$lib/server/mail/index';
import { EMAIL_ASSETS, resolveEmailAssetUrl, resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
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
		logoUrl: resolveEmailLogoUrl(input.origin),
		illustrationUrl: resolveEmailAssetUrl(EMAIL_ASSETS.forgotPassword, input.origin)
	};

	await sendMail({
		to: input.to,
		subject: 'Reset your Urixoft Workspace password',
		text: buildPasswordResetEmailText(content),
		html: buildPasswordResetEmailHtml(content)
	});
}
