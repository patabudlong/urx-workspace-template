/**
 * Maps legacy product names to current Urixoft branding in user-facing copy.
 */
const LEGACY_BRAND_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
	{ pattern: /neuro\s*xoft/gi, replacement: 'Urixoft' },
	{ pattern: /neuroxoft/gi, replacement: 'Urixoft' }
];

export function normalizeLegacyBrandText(text: string): string {
	let result = text;

	for (const { pattern, replacement } of LEGACY_BRAND_REPLACEMENTS) {
		result = result.replace(pattern, replacement);
	}

	return result;
}

/**
 * Normalizes legacy display names in RFC 5322 From headers, e.g.
 * `NeuroXoft Platform <noreply@urixoft.com>` → `Urixoft Platform <noreply@urixoft.com>`.
 */
export function normalizeLegacyBrandMailFrom(from: string): string {
	const trimmed = from.trim();
	const bracketMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);

	if (bracketMatch) {
		const displayName = normalizeLegacyBrandText(bracketMatch[1].trim());
		const address = bracketMatch[2].trim();
		return `${displayName} <${address}>`;
	}

	return normalizeLegacyBrandText(trimmed);
}
