import {
	buildBodyParagraphHtml,
	buildFooterNoteHtml,
	buildMutedInfoBoxHtml,
	buildPrimaryButtonHtml,
	buildTransactionalEmailHtml,
	buildTransactionalEmailText,
	escapeHtml
} from '$lib/server/mail/templates/transactional-email-layout';

export type SimpleEmailContent = {
	title: string;
	greeting?: string;
	paragraphs: string[];
	logoUrl: string;
	ctaLabel?: string;
	ctaUrl?: string;
	preheader?: string;
	illustrationUrl?: string;
	illustrationAlt?: string;
	illustrationWidth?: number;
	infoBoxParagraphs?: string[];
	footerNoteParagraphs?: string[];
};

export function buildSimpleEmailHtml(content: SimpleEmailContent): string {
	const greeting = content.greeting
		? buildBodyParagraphHtml(`Hi ${escapeHtml(content.greeting)},`)
		: '';
	const paragraphs = content.paragraphs
		.map((paragraph) => buildBodyParagraphHtml(escapeHtml(paragraph)))
		.join('');
	const cta =
		content.ctaLabel && content.ctaUrl
			? buildPrimaryButtonHtml(content.ctaLabel, content.ctaUrl)
			: '';
	const infoBox = content.infoBoxParagraphs?.length
		? buildMutedInfoBoxHtml(content.infoBoxParagraphs.map((paragraph) => escapeHtml(paragraph)))
		: '';
	const footerNote = content.footerNoteParagraphs?.length
		? buildFooterNoteHtml(
				content.footerNoteParagraphs.map((paragraph) => escapeHtml(paragraph)).join('<br><br>')
			)
		: '';

	return buildTransactionalEmailHtml({
		preheader: content.preheader ?? content.paragraphs[0] ?? content.title,
		documentTitle: content.title,
		logoUrl: content.logoUrl,
		headline: content.title,
		bodyHtml: `${greeting}${paragraphs}${cta}${infoBox}`,
		illustrationUrl: content.illustrationUrl,
		illustrationAlt: content.illustrationAlt,
		illustrationWidth: content.illustrationWidth,
		footerNoteHtml: footerNote || undefined
	});
}

export function buildSimpleEmailText(content: SimpleEmailContent): string {
	const lines: string[] = [];

	if (content.greeting) {
		lines.push(`Hi ${content.greeting},`, '');
	}

	lines.push(content.title, '', ...content.paragraphs);

	if (content.infoBoxParagraphs?.length) {
		lines.push('', ...content.infoBoxParagraphs);
	}

	if (content.ctaLabel && content.ctaUrl) {
		lines.push('', `${content.ctaLabel}: ${content.ctaUrl}`);
	}

	if (content.footerNoteParagraphs?.length) {
		lines.push('', ...content.footerNoteParagraphs);
	}

	return buildTransactionalEmailText(lines);
}
