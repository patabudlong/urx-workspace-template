import {
	buildBodyParagraphHtml,
	buildFooterNoteHtml,
	buildMutedInfoBoxHtml,
	buildPrimaryButtonHtml,
	buildTransactionalEmailHtml,
	buildTransactionalEmailText,
	escapeHtml
} from '$lib/server/mail/templates/transactional-email-layout';
import {
	resolveSecurityEmailCopy,
	type SecurityEmailKind,
	type SecurityEmailLevel
} from '$lib/shared/mail/security-alert-email';

export type SecurityAlertEmailContent = {
	level: SecurityEmailLevel;
	kind: SecurityEmailKind;
	greeting: string;
	occurredAtLabel: string;
	ipAddress?: string;
	deviceLabel: string;
	secureAccountUrl: string;
	logoUrl: string;
	illustrationUrl: string;
};

const ILLUSTRATION_ALT = 'Security alert illustration';

function buildInfoBoxHtmlLines(content: SecurityAlertEmailContent): string[] {
	const lines = [`<strong>Date and time:</strong> ${escapeHtml(content.occurredAtLabel)}`];

	if (content.ipAddress) {
		lines.push(`<strong>IP address:</strong> ${escapeHtml(content.ipAddress)}`);
	}

	lines.push(`<strong>Device:</strong> ${escapeHtml(content.deviceLabel)}`);

	return lines;
}

function buildInfoBoxTextLines(content: SecurityAlertEmailContent): string[] {
	const lines = [`Date and time: ${content.occurredAtLabel}`];

	if (content.ipAddress) {
		lines.push(`IP address: ${content.ipAddress}`);
	}

	lines.push(`Device: ${content.deviceLabel}`);

	return lines;
}

function buildSecureAccountFooterHtml(secureAccountUrl: string): string {
	const safeUrl = escapeHtml(secureAccountUrl);

	return `Wasn&#39;t you? <a href="${safeUrl}" style="color:#2563eb;text-decoration:underline;">Secure your account here</a>.`;
}

function buildSecureAccountFooterText(secureAccountUrl: string): string {
	return `Wasn't you? Secure your account here: ${secureAccountUrl}`;
}

export function buildSecurityAlertEmailHtml(content: SecurityAlertEmailContent): string {
	const copy = resolveSecurityEmailCopy({ level: content.level, kind: content.kind });
	const paragraphs = copy.paragraphs
		.map((paragraph) => buildBodyParagraphHtml(escapeHtml(paragraph)))
		.join('');

	return buildTransactionalEmailHtml({
		preheader: copy.preheader,
		documentTitle: copy.title,
		logoUrl: content.logoUrl,
		headline: copy.title,
		bodyHtml: [
			buildBodyParagraphHtml(`Hi ${escapeHtml(content.greeting)},`),
			paragraphs,
			buildPrimaryButtonHtml(copy.ctaLabel, content.secureAccountUrl),
			buildMutedInfoBoxHtml(buildInfoBoxHtmlLines(content))
		].join(''),
		illustrationUrl: content.illustrationUrl,
		illustrationAlt: ILLUSTRATION_ALT,
		footerNoteHtml: buildFooterNoteHtml(buildSecureAccountFooterHtml(content.secureAccountUrl))
	});
}

export function buildSecurityAlertEmailText(content: SecurityAlertEmailContent): string {
	const copy = resolveSecurityEmailCopy({ level: content.level, kind: content.kind });

	return buildTransactionalEmailText([
		`Hi ${content.greeting},`,
		'',
		copy.title,
		'',
		...copy.paragraphs,
		'',
		...buildInfoBoxTextLines(content),
		'',
		`${copy.ctaLabel}: ${content.secureAccountUrl}`,
		'',
		buildSecureAccountFooterText(content.secureAccountUrl)
	]);
}
