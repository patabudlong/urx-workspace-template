import type { TwoFactorMethod } from '$lib/shared/models/two-factor';
import { TWO_FACTOR_METHODS } from '$lib/shared/models/two-factor';
import { TWO_FACTOR_OTP_EXPIRY_MINUTES } from '$lib/shared/two-factor-otp-message';
import {
	BRAND_PRIMARY,
	buildBodyParagraphHtml,
	buildFooterNoteHtml,
	buildMutedInfoBoxHtml,
	buildTransactionalEmailHtml,
	buildTransactionalEmailText,
	buildVerificationCodeBoxHtml,
	escapeHtml
} from '$lib/server/mail/templates/transactional-email-layout';

export const TWO_FACTOR_EMAIL_ILLUSTRATIONS = {
	code: 'two-factor-code.png',
	status: 'two-factor-status.png'
} as const;

export type TwoFactorEmailIllustration = keyof typeof TWO_FACTOR_EMAIL_ILLUSTRATIONS;

export type TwoFactorEmailAssets = {
	logoUrl: string;
	illustrationUrl: string;
};

export type TwoFactorStatusChange = 'enabled' | 'disabled';

export type TwoFactorEmailLayoutContent = {
	title: string;
	preheader: string;
	greeting: string;
	paragraphs: string[];
	logoUrl: string;
	illustrationUrl: string;
	illustrationAlt?: string;
	verificationCode?: string;
	infoBoxHtmlLines?: string[];
	footerNoteHtml?: string;
};

export type TwoFactorCodeEmailContent = TwoFactorEmailAssets & {
	greeting: string;
	code: string;
};

export type TwoFactorStatusEmailContent = TwoFactorEmailAssets & {
	greeting: string;
	change: TwoFactorStatusChange;
	method?: TwoFactorMethod;
	changedAtLabel: string;
	ipAddress?: string;
	deviceLabel: string;
	secureAccountUrl: string;
};

const OTP_EXPIRY_LABEL = `${TWO_FACTOR_OTP_EXPIRY_MINUTES} minutes`;

const CODE_PREHEADER =
	`Your Urixoft Workspace verification code. It expires in ${OTP_EXPIRY_LABEL}.`;

const ILLUSTRATION_ALT = 'Two-factor authentication illustration';

export function twoFactorMethodLabel(method: TwoFactorMethod): string {
	switch (method) {
		case TWO_FACTOR_METHODS.TOTP:
			return 'Authenticator app';
		case TWO_FACTOR_METHODS.SMS:
			return 'Text message (SMS)';
		case TWO_FACTOR_METHODS.EMAIL:
			return 'Email';
		default:
			return 'Backup code';
	}
}

export function buildTwoFactorSecureAccountFooterHtml(secureAccountUrl: string): string {
	const safeUrl = escapeHtml(secureAccountUrl);

	return `Wasn&#39;t you? <a href="${safeUrl}" style="color:${BRAND_PRIMARY};text-decoration:underline;">Secure your account here</a>.`;
}

export function buildTwoFactorSecureAccountFooterText(secureAccountUrl: string): string {
	return `Wasn't you? Secure your account here: ${secureAccountUrl}`;
}

export function buildTwoFactorOtpFooterNoteHtml(): string {
	return `This code expires in <strong>${OTP_EXPIRY_LABEL}</strong>. If you did not request this code, you can ignore this email.`;
}

export function buildTwoFactorEmailHtml(content: TwoFactorEmailLayoutContent): string {
	const greeting = escapeHtml(content.greeting);
	const paragraphs = content.paragraphs
		.map((paragraph) => buildBodyParagraphHtml(escapeHtml(paragraph)))
		.join('');
	const verificationCode = content.verificationCode
		? buildVerificationCodeBoxHtml(content.verificationCode)
		: '';
	const infoBox = content.infoBoxHtmlLines?.length
		? buildMutedInfoBoxHtml(content.infoBoxHtmlLines)
		: '';

	return buildTransactionalEmailHtml({
		preheader: content.preheader,
		documentTitle: content.title,
		logoUrl: content.logoUrl,
		headline: content.title,
		bodyHtml: [
			buildBodyParagraphHtml(`Hi ${greeting},`),
			paragraphs,
			verificationCode,
			infoBox
		].join(''),
		illustrationUrl: content.illustrationUrl,
		illustrationAlt: content.illustrationAlt ?? ILLUSTRATION_ALT,
		footerNoteHtml: content.footerNoteHtml
			? buildFooterNoteHtml(content.footerNoteHtml)
			: undefined
	});
}

export function buildTwoFactorEmailText(
	content: TwoFactorEmailLayoutContent,
	footerLines: string[] = []
): string {
	const lines = [`Hi ${content.greeting},`, '', content.title, '', ...content.paragraphs];

	if (content.verificationCode) {
		lines.push('', `Your verification code: ${content.verificationCode}`);
	}

	if (content.infoBoxHtmlLines?.length) {
		lines.push('', ...content.infoBoxHtmlLines.map(stripHtml));
	}

	if (footerLines.length) {
		lines.push('', ...footerLines);
	}

	return buildTransactionalEmailText(lines);
}

function stripHtml(value: string): string {
	return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function buildStatusTitle(change: TwoFactorStatusChange): string {
	return change === 'enabled'
		? 'Two-factor authentication enabled'
		: 'Two-factor authentication disabled';
}

function buildStatusPreheader(change: TwoFactorStatusChange): string {
	return change === 'enabled'
		? 'Two-factor authentication was enabled on your Urixoft Workspace account.'
		: 'Two-factor authentication was disabled on your Urixoft Workspace account.';
}

function buildStatusParagraphs(content: TwoFactorStatusEmailContent): string[] {
	if (content.change === 'enabled') {
		const method = content.method ? twoFactorMethodLabel(content.method) : 'A verification method';

		return [
			'Two-factor authentication was enabled on your Urixoft Workspace account.',
			`${method} will be required as a second step when you sign in.`
		];
	}

	return [
		'Two-factor authentication was disabled on your Urixoft Workspace account.',
		'Sign-ins will only require your password or linked sign-in method until you enable two-factor authentication again.'
	];
}

function buildStatusInfoBoxLines(content: TwoFactorStatusEmailContent): string[] {
	const lines = [`<strong>Date and time:</strong> ${escapeHtml(content.changedAtLabel)}`];

	if (content.ipAddress) {
		lines.push(`<strong>IP address:</strong> ${escapeHtml(content.ipAddress)}`);
	}

	lines.push(`<strong>Device:</strong> ${escapeHtml(content.deviceLabel)}`);

	if (content.change === 'enabled' && content.method) {
		lines.push(`<strong>Method:</strong> ${escapeHtml(twoFactorMethodLabel(content.method))}`);
	}

	return lines;
}

function buildStatusInfoBoxTextLines(content: TwoFactorStatusEmailContent): string[] {
	const lines = [`Date and time: ${content.changedAtLabel}`];

	if (content.ipAddress) {
		lines.push(`IP address: ${content.ipAddress}`);
	}

	lines.push(`Device: ${content.deviceLabel}`);

	if (content.change === 'enabled' && content.method) {
		lines.push(`Method: ${twoFactorMethodLabel(content.method)}`);
	}

	return lines;
}

export function buildTwoFactorCodeEmailHtml(content: TwoFactorCodeEmailContent): string {
	return buildTwoFactorEmailHtml({
		title: 'Your verification code',
		preheader: CODE_PREHEADER,
		greeting: content.greeting,
		paragraphs: [
			`Your Urixoft verification code is ready. It expires in ${OTP_EXPIRY_LABEL}.`,
			'Use this code to complete two-factor authentication for your Urixoft Workspace account.'
		],
		logoUrl: content.logoUrl,
		illustrationUrl: content.illustrationUrl,
		verificationCode: content.code,
		footerNoteHtml: buildTwoFactorOtpFooterNoteHtml()
	});
}

export function buildTwoFactorCodeEmailText(content: TwoFactorCodeEmailContent): string {
	return buildTwoFactorEmailText(
		{
			title: 'Your verification code',
			preheader: CODE_PREHEADER,
			greeting: content.greeting,
			paragraphs: [
				`Your Urixoft verification code is ${content.code}. It expires in ${OTP_EXPIRY_LABEL}.`,
				'Use this code to complete two-factor authentication for your Urixoft Workspace account.'
			],
			logoUrl: content.logoUrl,
			illustrationUrl: content.illustrationUrl
		},
		['If you did not request this code, you can ignore this email.']
	);
}

export function buildTwoFactorStatusEmailHtml(content: TwoFactorStatusEmailContent): string {
	const title = buildStatusTitle(content.change);

	return buildTwoFactorEmailHtml({
		title,
		preheader: buildStatusPreheader(content.change),
		greeting: content.greeting,
		paragraphs: buildStatusParagraphs(content),
		logoUrl: content.logoUrl,
		illustrationUrl: content.illustrationUrl,
		illustrationAlt: 'Account security illustration',
		infoBoxHtmlLines: buildStatusInfoBoxLines(content),
		footerNoteHtml: buildTwoFactorSecureAccountFooterHtml(content.secureAccountUrl)
	});
}

export function buildTwoFactorStatusEmailText(content: TwoFactorStatusEmailContent): string {
	const title = buildStatusTitle(content.change);

	return buildTwoFactorEmailText(
		{
			title,
			preheader: buildStatusPreheader(content.change),
			greeting: content.greeting,
			paragraphs: buildStatusParagraphs(content),
			logoUrl: content.logoUrl,
			illustrationUrl: content.illustrationUrl,
			infoBoxHtmlLines: buildStatusInfoBoxTextLines(content)
		},
		[buildTwoFactorSecureAccountFooterText(content.secureAccountUrl)]
	);
}
