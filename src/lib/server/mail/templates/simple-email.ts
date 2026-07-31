import { APP_NAME } from '$lib/shared/site-meta';

export type SimpleEmailContent = {
	title: string;
	greeting?: string;
	paragraphs: string[];
	logoUrl: string;
	ctaLabel?: string;
	ctaUrl?: string;
};

export function buildSimpleEmailHtml(content: SimpleEmailContent): string {
	const greeting = content.greeting ? `<p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#4b5563;">Hi ${escapeHtml(content.greeting)},</p>` : '';
	const paragraphs = content.paragraphs
		.map(
			(paragraph) =>
				`<p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#4b5563;">${escapeHtml(paragraph)}</p>`
		)
		.join('');
	const cta =
		content.ctaLabel && content.ctaUrl
			? `<p style="margin:24px 0 0 0;"><a href="${escapeHtml(content.ctaUrl)}" style="display:inline-block;background-color:#0471B7;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">${escapeHtml(content.ctaLabel)}</a></p>`
			: '';

	return [
		'<!DOCTYPE html>',
		'<html lang="en">',
		'<head><meta charset="utf-8"><title>',
		escapeHtml(content.title),
		'</title></head>',
		'<body style="margin:0;padding:0;background-color:#f4f7fb;">',
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">',
		'<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">',
		'<tr><td style="padding:28px 32px 8px 32px;">',
		`<img src="${escapeHtml(content.logoUrl)}" width="52" height="46" alt="${escapeHtml(APP_NAME)}" style="display:block;border:0;">`,
		`<h1 style="margin:20px 0 0 0;font-size:22px;line-height:28px;color:#111827;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(content.title)}</h1>`,
		'</td></tr>',
		`<tr><td style="padding:8px 32px 32px 32px;font-family:Arial,Helvetica,sans-serif;">${greeting}${paragraphs}${cta}</td></tr>`,
		'</table>',
		`<p style="margin:16px 0 0 0;font-size:12px;line-height:18px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;">&copy; ${new Date().getFullYear()} Urixoft Platform</p>`,
		'</td></tr></table>',
		'</body>',
		'</html>'
	].join('');
}

export function buildSimpleEmailText(content: SimpleEmailContent): string {
	const lines = [
		content.greeting ? `Hi ${content.greeting},` : '',
		'',
		content.title,
		'',
		...content.paragraphs,
		''
	];

	if (content.ctaLabel && content.ctaUrl) {
		lines.push(`${content.ctaLabel}: ${content.ctaUrl}`, '');
	}

	lines.push(`- ${APP_NAME}`);

	return lines.filter((line, index, array) => !(line === '' && array[index - 1] === '')).join('\n');
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
