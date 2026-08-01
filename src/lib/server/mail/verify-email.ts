import { sendMail } from '$lib/server/mail/index';
import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import { buildVerifyEmailHtml, buildVerifyEmailText } from '$lib/server/mail/templates/verify-email';

export async function sendVerifyEmail(input: {
	to: string;
	firstName: string;
	code: string;
	origin: string;
}): Promise<void> {
	const greeting = input.firstName.trim() || 'there';
	const platformOrigin = resolvePlatformWorkspaceOrigin(input.origin);
	const content = {
		greeting,
		code: input.code,
		logoUrl: `${platformOrigin}/email/urixoft-logo.png`,
		illustrationUrl: `${platformOrigin}/email/verify-email.png`
	};

	await sendMail({
		to: input.to,
		subject: 'Verify your Urixoft Workspace email',
		text: buildVerifyEmailText(content),
		html: buildVerifyEmailHtml(content)
	});
}
