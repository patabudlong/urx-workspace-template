import { sendMail } from '$lib/server/mail/index';
import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import {
	buildSimpleEmailHtml,
	buildSimpleEmailText
} from '$lib/server/mail/templates/simple-email';

export async function sendTwoFactorEmailCode(input: {
	email: string;
	code: string;
	origin?: string;
}): Promise<void> {
	const platformOrigin = resolvePlatformWorkspaceOrigin(input.origin ?? '');
	const content = {
		title: 'Your sign-in code',
		preheader: 'Use this code to complete two-factor authentication.',
		paragraphs: [
			'Enter this verification code to continue. It expires in 15 minutes.',
			`Your code: ${input.code}`
		],
		logoUrl: `${platformOrigin}/email/urixoft-logo.png`
	};

	await sendMail({
		to: input.email,
		subject: 'Your Urixoft sign-in code',
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
