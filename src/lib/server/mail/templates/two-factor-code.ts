import {
	buildBodyParagraphHtml,
	buildMutedInfoBoxHtml,
	buildTransactionalEmailHtml,
	buildTransactionalEmailText,
	buildVerificationCodeBoxHtml,
	escapeHtml
} from '$lib/server/mail/templates/transactional-email-layout';

export type TwoFactorCodeEmailContent = {
	greeting: string;
	code: string;
	logoUrl: string;
	illustrationUrl: string;
};

const PREHEADER_TEXT =
	'Your Urixoft Workspace sign-in code. It expires in 15 minutes.';

export function buildTwoFactorCodeEmailHtml(content: TwoFactorCodeEmailContent): string {
	const greeting = escapeHtml(content.greeting);

	return buildTransactionalEmailHtml({
		preheader: PREHEADER_TEXT,
		documentTitle: 'Your sign-in code',
		logoUrl: content.logoUrl,
		headline: 'Your sign-in code',
		bodyHtml: [
			buildBodyParagraphHtml(
				`Hi ${greeting}, use this code to complete two-factor authentication for your Urixoft Workspace account.`
			),
			buildVerificationCodeBoxHtml(content.code),
			buildMutedInfoBoxHtml([
				'This code expires in <strong>15 minutes</strong>.',
				'If you did not request this code, you can ignore this email.'
			])
		].join(''),
		illustrationUrl: content.illustrationUrl,
		illustrationAlt: 'Two-factor authentication illustration'
	});
}

export function buildTwoFactorCodeEmailText(content: TwoFactorCodeEmailContent): string {
	return buildTransactionalEmailText([
		`Hi ${content.greeting},`,
		'',
		'Use this code to complete two-factor authentication for your Urixoft Workspace account.',
		`Your verification code: ${content.code}`,
		'',
		'This code expires in 15 minutes.',
		'If you did not request this code, you can ignore this email.'
	]);
}
