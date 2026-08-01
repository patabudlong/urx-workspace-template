import { APP_NAME, URIXOFT_SOCIAL, URIXOFT_WEBSITE } from '$lib/shared/site-meta';

const BRAND_PRIMARY = '#0471B7';
const BRAND_TERTIARY = '#C8E6F7';
const PAGE_BG = '#f4f7fb';
const MUTED_BG = '#f9fafb';
const TEXT_PRIMARY = '#111827';
const TEXT_BODY = '#4b5563';
const TEXT_MUTED = '#6b7280';
const TEXT_FOOTER = '#9ca3af';
const BORDER = '#e5e7eb';

const COMPANY_ADDRESS_LINES = [
	'Door 1, Lote 84 Business Hub Bldg, Palm Street, Mintal Tugbok',
	'Davao City, 8000, Philippines'
] as const;

const BRAND_TAGLINE = 'Your business workspace, made simple.';
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

function formatVerificationCode(code: string): string {
	return code.replace(/(\d{3})(\d{3})/, '$1 $2');
}

/**
 * Keep every HTML line under 76 chars so nodemailer can send 7bit.
 */
export function buildVerifyEmailHtml(content: VerifyEmailContent): string {
	const greeting = escapeHtml(content.greeting);
	const formattedCode = escapeHtml(formatVerificationCode(content.code));
	const logoUrl = escapeHtml(content.logoUrl);
	const illustrationUrl = escapeHtml(content.illustrationUrl);
	const preheader = escapeHtml(PREHEADER_TEXT);
	const appName = escapeHtml(APP_NAME);
	const brandTagline = escapeHtml(BRAND_TAGLINE);
	const websiteUrl = escapeHtml(URIXOFT_WEBSITE);

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
		'<table role="presentation"',
		'width="100%" cellpadding="0"',
		'cellspacing="0" border="0"',
		`style="background-color:${MUTED_BG};`,
		'border-radius:8px;margin-bottom:20px;">',
		'<tr>',
		'<td align="center"',
		'style="padding:20px 16px;',
		'font-family:Arial,Helvetica,sans-serif;">',
		'<p style="margin:0 0 8px 0;',
		'font-size:12px;line-height:18px;',
		`color:${TEXT_MUTED};`,
		'letter-spacing:0.08em;',
		'text-transform:uppercase;">',
		'Verification code',
		'</p>',
		'<p style="margin:0;',
		'font-size:32px;line-height:40px;',
		'font-weight:700;letter-spacing:0.2em;',
		`color:${BRAND_PRIMARY};`,
		'font-family:Consolas,Monaco,monospace;">',
		formattedCode,
		'</p>',
		'</td>',
		'</tr>',
		'</table>',
		'<table role="presentation"',
		'width="100%" cellpadding="0"',
		'cellspacing="0" border="0"',
		`style="background-color:${MUTED_BG};`,
		'border-radius:8px;margin-bottom:24px;">',
		'<tr>',
		'<td style="padding:14px 16px;',
		'font-family:Arial,Helvetica,sans-serif;">',
		'<p style="margin:0 0 6px 0;',
		'font-size:13px;line-height:20px;',
		`color:${TEXT_MUTED};">`,
		'This code expires in',
		'<strong>15 minutes</strong>.',
		'</p>',
		'<p style="margin:0;',
		'font-size:13px;line-height:20px;',
		`color:${TEXT_MUTED};">`,
		'If you did not create an account,',
		'you can ignore this email.',
		'</p>',
		'</td>',
		'</tr>',
		'</table>',
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

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
