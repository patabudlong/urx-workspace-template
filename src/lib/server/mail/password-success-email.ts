import { sendMail } from '$lib/server/mail/index';
import { buildSimpleEmailHtml, buildSimpleEmailText } from '$lib/server/mail/templates/simple-email';
import { formatEmailDateTime } from '$lib/shared/format-datetime';

export async function sendPasswordSuccessEmail(input: {
	to: string;
	firstName: string;
	changedAt: Date;
	origin: string;
}): Promise<void> {
	const greeting = input.firstName.trim() || 'there';
	const changedAtLabel = formatEmailDateTime(input.changedAt);
	const loginUrl = `${input.origin}/login`;

	const content = {
		title: 'Your password was changed',
		greeting,
		preheader: 'Your Urixoft Workspace password was changed successfully.',
		paragraphs: [
			'Your Urixoft Workspace password was changed successfully.',
			'You may now sign in using your new password.'
		],
		infoBoxParagraphs: [
			`Time of change: ${changedAtLabel}`,
			'If you did not request this change, please reply to this email or contact our support team right away to protect your account.'
		],
		ctaLabel: 'Sign in',
		ctaUrl: loginUrl,
		logoUrl: `${input.origin}/email/urixoft-logo.png`,
		illustrationUrl: `${input.origin}/email/password-success.png`,
		illustrationAlt: 'Password changed successfully'
	};

	await sendMail({
		to: input.to,
		subject: 'Your Urixoft Workspace password was changed',
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
