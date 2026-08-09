import { sendMail } from '$lib/server/mail/index';
import { EMAIL_ASSETS, resolveEmailAssetUrl, resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
import { buildVerifyEmailHtml, buildVerifyEmailText } from '$lib/server/mail/templates/verify-email';

export async function sendVerifyEmail(input: {
	to: string;
	firstName: string;
	code: string;
	origin: string;
}): Promise<void> {
	const greeting = input.firstName.trim() || 'there';
	const content = {
		greeting,
		code: input.code,
		logoUrl: resolveEmailLogoUrl(input.origin),
		illustrationUrl: resolveEmailAssetUrl(EMAIL_ASSETS.verifyEmail, input.origin)
	};

	await sendMail({
		to: input.to,
		subject: 'Verify your Urixoft Workspace email',
		text: buildVerifyEmailText(content),
		html: buildVerifyEmailHtml(content)
	});
}
