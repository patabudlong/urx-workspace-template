import { APP_NAME, URIXOFT_SOCIAL, URIXOFT_WEBSITE } from '$lib/shared/site-meta';
import {
	BRAND_PRIMARY,
	BRAND_TERTIARY,
	BRAND_TAGLINE,
	COMPANY_ADDRESS_LINES,
	PAGE_BG,
	TEXT_BODY,
	TEXT_FOOTER,
	TEXT_PRIMARY,
	buildMutedInfoBoxHtml,
	buildVerificationCodeBoxHtml,
	escapeHtml
} from '$lib/server/mail/templates/transactional-email-layout';
const LOGO_DISPLAY_WIDTH = 52;
const LOGO_DISPLAY_HEIGHT = 46;
const LOGO_BORDER_RADIUS = 6;
const BRAND_NAME_FONT_SIZE = 14;
const BRAND_NAME_LINE_HEIGHT = 17;
const BRAND_TAGLINE_FONT_SIZE = 12;
const BRAND_TAGLINE_LINE_HEIGHT = 15;
const ILLUSTRATION_DISPLAY_WIDTH = 240;

export type VerifyEmailContent = {
	greeting: string;
	code: string;
	logoUrl: string;
	illustrationUrl: string;
};

const PREHEADER_TEXT =
	'Your Urixoft Workspace verification code. It expires in 15 minutes.';

/**
 * Keep every HTML line under 76 chars so nodemailer can send 7bit.
 */
export function buildVerifyEmailHtml(content: VerifyEmailContent): string {
	const greeting = escapeHtml(content.greeting);
	const logoUrl = escapeHtml(content.logoUrl);
	const illustrationUrl = escapeHtml(content.illustrationUrl);
	const preheader = escapeHtml(PREHEADER_TEXT);
	const appName = escapeHtml(APP_NAME);
	const brandTagline = escapeHtml(BRAND_TAGLINE);
	const websiteUrl = escapeHtml(URIXOFT_WEBSITE);
	const codeBox = buildVerificationCodeBoxHtml(content.code);
	const infoBox = buildMutedInfoBoxHtml([
		'This code expires in <strong>15 minutes</strong>.',
		'If you did not create an account, you can ignore this email.'
	]);

	return [
		'<!DOCTYPE html>',
		'<html lang="en">',
		'<head>',
		'<meta charset="utf-8">',
		'<meta name="viewport"',
		'content="width=device-width">',
		'<title>Verify your email</title>',
		'</head>',
		'<body style="margin:0;padding:0;',
		`background-color:${PAGE_BG};">`,
		`<div style="display:none;max-height:0;overflow:hidden;`,
		`opacity:0;color:transparent;">`,
		preheader,
		'</div>',
		'<table role="presentation"',
		'width="100%" cellpadding="0"',
		'cellspacing="0" border="0"',
		`style="background-color:${PAGE_BG};">`,
		'<tr>',
		'<td align="center"',
		'style="padding:32px 16px;">',
		'<table role="presentation"',
		'width="520" cellpadding="0"',
		'cellspacing="0" border="0"',
		'style="width:100%;max-width:520px;',
		'margin-bottom:20px;">',
		'<tr>',
		'<td style="font-family:Arial,Helvetica,sans-serif;">',
		'<a',
		`href="${websiteUrl}"`,
		'target="_blank"',
		'style="text-decoration:none;display:inline-block;">',
		'<table role="presentation"',
		'cellpadding="0" cellspacing="0" border="0">',
		'<tr>',
		'<td style="padding-right:12px;',
		'vertical-align:middle;width:1px;">',
		'<img',
		`src="${logoUrl}"`,
		`width="${LOGO_DISPLAY_WIDTH}"`,
		`height="${LOGO_DISPLAY_HEIGHT}"`,
		'alt="Urixoft"',
		'style="display:block;',
		`width:${LOGO_DISPLAY_WIDTH}px;`,
		`height:${LOGO_DISPLAY_HEIGHT}px;`,
		`border-radius:${LOGO_BORDER_RADIUS}px;`,
		'border:0;">',
		'</td>',
		'<td style="vertical-align:middle;',
		'font-family:Arial,Helvetica,sans-serif;">',
		'<p style="margin:0;',
		`font-size:${BRAND_NAME_FONT_SIZE}px;`,
		`line-height:${BRAND_NAME_LINE_HEIGHT}px;`,
		'font-weight:600;',
		`color:${TEXT_FOOTER};">`,
		appName,
		'</p>',
		'<p style="margin:1px 0 0 0;',
		`font-size:${BRAND_TAGLINE_FONT_SIZE}px;`,
		`line-height:${BRAND_TAGLINE_LINE_HEIGHT}px;`,
		`color:${TEXT_FOOTER};">`,
		brandTagline,
		'</p>',
		'</td>',
		'</tr>',
		'</table>',
		'</a>',
		'</td>',
		'</tr>',
		'</table>',
		'<table role="presentation"',
		'width="520" cellpadding="0"',
		'cellspacing="0" border="0"',
		'style="width:100%;max-width:520px;',
		'background-color:#ffffff;',
		'border-radius:12px;overflow:hidden;">',
		'<tr>',
		'<td style="padding:24px 32px 0 32px;',
		'font-family:Arial,Helvetica,sans-serif;">',
		'<h1 style="margin:0 0 8px 0;',
		'font-size:22px;line-height:28px;',
		'font-weight:600;',
		`color:${TEXT_PRIMARY};">`,
		'Verify your email',
		'</h1>',
		'<p style="margin:0 0 20px 0;',
		'font-size:14px;line-height:22px;',
		`color:${TEXT_BODY};">`,
		`Hi ${greeting}, thanks for signing up for`,
		'Urixoft Workspace. Enter this code on',
		'the verification page to confirm your',
		'email address.',
		'</p>',
		codeBox,
		infoBox,
		'</td>',
		'</tr>',
		'<tr>',
		'<td align="center"',
		`bgcolor="${BRAND_TERTIARY}"`,
		'style="padding:20px 32px;',
		`background-color:${BRAND_TERTIARY};">`,
		'<img',
		`src="${illustrationUrl}"`,
		`width="${ILLUSTRATION_DISPLAY_WIDTH}"`,
		`height="${ILLUSTRATION_DISPLAY_WIDTH}"`,
		'alt="Email verification illustration"',
		'style="display:block;margin:0 auto;',
		`width:${ILLUSTRATION_DISPLAY_WIDTH}px;`,
		`height:${ILLUSTRATION_DISPLAY_WIDTH}px;`,
		'max-width:100%;border:0;',
		'-ms-interpolation-mode:bicubic;">',
		'</td>',
		'</tr>',
		'</table>',
		'<table role="presentation"',
		'width="520" cellpadding="0"',
		'cellspacing="0" border="0"',
		'style="width:100%;max-width:520px;',
		'margin-top:24px;">',
		'<tr>',
		'<td align="center"',
		'style="font-family:Arial,Helvetica,sans-serif;">',
		'<p style="margin:0;font-size:12px;',
		`line-height:18px;color:${TEXT_FOOTER};">`,
		`&copy; ${new Date().getFullYear()} Urixoft Workspace`,
		'</p>',
		'<p style="margin:8px 0 0 0;',
		'font-size:11px;line-height:16px;',
		`color:${TEXT_FOOTER};">`,
		COMPANY_ADDRESS_LINES[0],
		'<br>',
		COMPANY_ADDRESS_LINES[1],
		'</p>',
		'<p style="margin:12px 0 0 0;',
		'font-size:11px;line-height:16px;',
		`color:${TEXT_FOOTER};">`,
		'<a',
		`href="${escapeHtml(URIXOFT_WEBSITE)}"`,
		`style="color:${BRAND_PRIMARY};`,
		'text-decoration:underline;">',
		'urixoft.com',
		'</a>',
		'&nbsp;|&nbsp;',
		'<a',
		`href="${escapeHtml(URIXOFT_SOCIAL.facebook)}"`,
		`style="color:${BRAND_PRIMARY};`,
		'text-decoration:underline;">',
		'facebook',
		'</a>',
		'&nbsp;|&nbsp;',
		'<a',
		`href="${escapeHtml(URIXOFT_SOCIAL.linkedin)}"`,
		`style="color:${BRAND_PRIMARY};`,
		'text-decoration:underline;">',
		'linkedin',
		'</a>',
		'</p>',
		'</td>',
		'</tr>',
		'</table>',
		'</td>',
		'</tr>',
		'</table>',
		'</body>',
		'</html>'
	].join('\n');
}

export function buildVerifyEmailText(content: VerifyEmailContent): string {
	return [
		`Hi ${content.greeting},`,
		'',
		'Thanks for signing up for Urixoft Workspace.',
		`Your verification code: ${content.code}`,
		'',
		'Enter this code on the verification page to confirm your email address.',
		'This code expires in 15 minutes.',
		'If you did not create an account, you can ignore this email.',
		'',
		'- Urixoft Workspace',
		'',
		...COMPANY_ADDRESS_LINES,
		'',
		`urixoft.com: ${URIXOFT_WEBSITE}`,
		`facebook: ${URIXOFT_SOCIAL.facebook}`,
		`linkedin: ${URIXOFT_SOCIAL.linkedin}`
	].join('\n');
}
