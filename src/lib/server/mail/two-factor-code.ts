import { sendMail } from '$lib/server/mail/index';
import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import {
	buildTwoFactorCodeEmailHtml,
	buildTwoFactorCodeEmailText
} from '$lib/server/mail/templates/two-factor-code';

export async function sendTwoFactorEmailCode(input: {
	email: string;
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
		illustrationUrl: `${platformOrigin}/email/two-factor-code.png`
	};

	await sendMail({
		to: input.email,
		subject: 'Your Urixoft sign-in code',
		text: buildTwoFactorCodeEmailText(content),
		html: buildTwoFactorCodeEmailHtml(content)
	});
}
