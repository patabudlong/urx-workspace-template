import type { MailparserAttachment } from 'mailparser';

function normalizeContentId(contentId: string): string {
	return contentId.replace(/^<|>$/g, '');
}

/**
 * Replace cid: image references with data URLs so forwarded HTML keeps inline images.
 */
export function inlineCidImagesInHtml(
	html: string,
	attachments: MailparserAttachment[] | undefined
): string {
	if (!attachments?.length) {
		return html;
	}

	let result = html;

	for (const attachment of attachments) {
		if (!attachment.content?.length) {
			continue;
		}

		const rawId = attachment.contentId ?? attachment.cid;
		if (!rawId) {
			continue;
		}

		const contentId = normalizeContentId(String(rawId));
		const mimeType = attachment.contentType || 'application/octet-stream';
		const dataUrl = `data:${mimeType};base64,${Buffer.from(attachment.content).toString('base64')}`;
		const variants = new Set([
			`cid:${contentId}`,
			`cid:${contentId.toLowerCase()}`,
			`cid:${String(rawId)}`,
			`cid:${String(rawId).toLowerCase()}`
		]);

		for (const variant of variants) {
			result = result.split(variant).join(dataUrl);
		}
	}

	return result;
}
