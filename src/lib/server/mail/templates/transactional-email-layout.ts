import { APP_NAME, URIXOFT_SOCIAL, URIXOFT_WEBSITE } from '$lib/shared/site-meta';

export const BRAND_PRIMARY = '#0471B7';
export const BRAND_TERTIARY = '#C8E6F7';
export const PAGE_BG = '#f4f7fb';
export const MUTED_BG = '#f9fafb';
export const TEXT_PRIMARY = '#111827';
export const TEXT_BODY = '#4b5563';
export const TEXT_MUTED = '#6b7280';
export const TEXT_FOOTER = '#9ca3af';
export const BORDER = '#e5e7eb';

export const COMPANY_ADDRESS_LINES = [
	'Door 1, Lote 84 Business Hub Bldg, Palm Street, Mintal Tugbok',
	'Davao City, 8000, Philippines'
] as const;

export const BRAND_TAGLINE = 'Your business workspace, made simple.';
export const SENT_VIA_URIXOFT_WORKSPACE_TEXT =
	'This message was sent using Urixoft Workspace.';
const LOGO_DISPLAY_WIDTH = 52;
const LOGO_DISPLAY_HEIGHT = 46;
const LOGO_BORDER_RADIUS = 6;
const BRAND_NAME_FONT_SIZE = 14;
const BRAND_NAME_LINE_HEIGHT = 17;
const BRAND_TAGLINE_FONT_SIZE = 12;
const BRAND_TAGLINE_LINE_HEIGHT = 15;
const ILLUSTRATION_DISPLAY_WIDTH = 240;

export type TransactionalEmailLayoutInput = {
	preheader: string;
	documentTitle: string;
	logoUrl: string;
	headline?: string;
	bodyHtml: string;
	illustrationUrl?: string;
	illustrationAlt?: string;
	illustrationWidth?: number;
	footerNoteHtml?: string;
	sentViaFooter?: boolean;
};

/**
 * Shared Urixoft transactional email shell.
 * Keep every HTML line under 76 chars so nodemailer can send 7bit.
 */
export function buildTransactionalEmailHtml(input: TransactionalEmailLayoutInput): string {
	const preheader = escapeHtml(input.preheader);
	const documentTitle = escapeHtml(input.documentTitle);
	const logoUrl = escapeHtml(input.logoUrl);
	const headline = escapeHtml(input.headline?.trim() ?? '');
	const appName = escapeHtml(APP_NAME);
	const brandTagline = escapeHtml(BRAND_TAGLINE);
	const websiteUrl = escapeHtml(URIXOFT_WEBSITE);
	const illustrationUrl = input.illustrationUrl
		? escapeHtml(input.illustrationUrl)
		: undefined;
	const illustrationAlt = escapeHtml(input.illustrationAlt ?? 'Illustration');
	const illustrationWidth = input.illustrationWidth ?? ILLUSTRATION_DISPLAY_WIDTH;

	const illustrationRow = illustrationUrl
		? [
				'<tr>',
				'<td align="center"',
				`bgcolor="${BRAND_TERTIARY}"`,
				'style="padding:20px 32px;',
				`background-color:${BRAND_TERTIARY};">`,
				'<img',
				`src="${illustrationUrl}"`,
				`width="${illustrationWidth}"`,
				`height="${illustrationWidth}"`,
				`alt="${illustrationAlt}"`,
				'style="display:block;margin:0 auto;',
				`width:${illustrationWidth}px;`,
				`height:${illustrationWidth}px;`,
				'max-width:100%;border:0;',
				'-ms-interpolation-mode:bicubic;">',
				'</td>',
				'</tr>'
			]
		: [];

	const footerNoteRow = input.footerNoteHtml
		? [
				'<tr>',
				'<td style="padding:16px 32px 24px 32px;',
				`border-top:1px solid ${BORDER};`,
				'font-family:Arial,Helvetica,sans-serif;">',
				input.footerNoteHtml,
				'</td>',
				'</tr>'
			]
		: [];

	const sentViaFooterRow = input.sentViaFooter
		? [
				'<tr>',
				'<td style="padding:16px 32px 24px 32px;',
				input.footerNoteHtml ? '' : `border-top:1px solid ${BORDER};`,
				'font-family:Arial,Helvetica,sans-serif;">',
				buildSentViaFooterHtml(),
				'</td>',
				'</tr>'
			]
		: [];

	const headlineBlock = headline
		? [
				'<h1 style="margin:0 0 8px 0;',
				'font-size:22px;line-height:28px;',
				'font-weight:600;',
				`color:${TEXT_PRIMARY};">`,
				headline,
				'</h1>'
			].join('')
		: '';

	const bodyCellPadding = headline ? 'padding:24px 32px 0 32px;' : 'padding:24px 32px;';

	return [
		'<!DOCTYPE html>',
		'<html lang="en">',
		'<head>',
		'<meta charset="utf-8">',
		'<meta name="viewport"',
		'content="width=device-width">',
		`<title>${documentTitle}</title>`,
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
		`<td style="${bodyCellPadding}`,
		'font-family:Arial,Helvetica,sans-serif;">',
		headlineBlock,
		input.bodyHtml,
		'</td>',
		'</tr>',
		...illustrationRow,
		...footerNoteRow,
		...sentViaFooterRow,
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

export function buildTransactionalEmailText(lines: string[]): string {
	return [
		...lines,
		'',
		`- ${APP_NAME}`,
		'',
		...COMPANY_ADDRESS_LINES,
		'',
		`urixoft.com: ${URIXOFT_WEBSITE}`,
		`facebook: ${URIXOFT_SOCIAL.facebook}`,
		`linkedin: ${URIXOFT_SOCIAL.linkedin}`
	].join('\n');
}

export function buildFooterNoteHtml(text: string): string {
	return [
		'<p style="margin:0;',
		'font-size:12px;line-height:18px;',
		`color:${TEXT_MUTED};">`,
		text,
		'</p>'
	].join('\n');
}

export function buildSentViaFooterHtml(): string {
	return buildFooterNoteHtml(escapeHtml(SENT_VIA_URIXOFT_WORKSPACE_TEXT));
}

export function buildBodyParagraphHtml(text: string): string {
	return [
		'<p style="margin:0 0 20px 0;',
		'font-size:14px;line-height:22px;',
		`color:${TEXT_BODY};">`,
		text,
		'</p>'
	].join('\n');
}

export function buildMutedInfoBoxHtml(paragraphs: string[]): string {
	const inner = paragraphs
		.map((paragraph, index) => {
			const margin = index < paragraphs.length - 1 ? 'margin:0 0 6px 0;' : 'margin:0;';

			return [
				'<p style="',
				margin,
				'font-size:13px;line-height:20px;',
				`color:${TEXT_MUTED};">`,
				paragraph,
				'</p>'
			].join('');
		})
		.join('');

	return [
		'<table role="presentation"',
		'width="100%" cellpadding="0"',
		'cellspacing="0" border="0"',
		`style="background-color:${MUTED_BG};`,
		'border-radius:8px;margin-bottom:24px;">',
		'<tr>',
		'<td style="padding:14px 16px;',
		'font-family:Arial,Helvetica,sans-serif;">',
		inner,
		'</td>',
		'</tr>',
		'</table>'
	].join('\n');
}

export function buildPrimaryButtonHtml(label: string, url: string): string {
	const safeLabel = escapeHtml(label);
	const safeUrl = escapeHtml(url);

	return [
		'<table role="presentation"',
		'width="100%" cellpadding="0"',
		'cellspacing="0" border="0"',
		'style="margin-bottom:20px;">',
		'<tr>',
		'<td align="center"',
		`bgcolor="${BRAND_PRIMARY}"`,
		'style="border-radius:8px;',
		`background-color:${BRAND_PRIMARY};">`,
		'<a',
		`href="${safeUrl}"`,
		'target="_blank"',
		'style="display:block;',
		'padding:10px 16px;',
		'font-family:Arial,Helvetica,sans-serif;',
		'font-size:14px;font-weight:600;',
		'line-height:20px;text-align:center;',
		'color:#ffffff;text-decoration:none;',
		'border-radius:8px;">',
		safeLabel,
		'</a>',
		'</td>',
		'</tr>',
		'</table>'
	].join('\n');
}

export function formatVerificationCode(code: string): string {
	return code.replace(/(\d{3})(\d{3})/, '$1 $2');
}

export function buildVerificationCodeBoxHtml(code: string): string {
	const formattedCode = escapeHtml(formatVerificationCode(code));

	return [
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
		'</table>'
	].join('\n');
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
