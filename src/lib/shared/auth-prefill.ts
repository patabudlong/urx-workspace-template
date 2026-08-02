export function safeEmailPrefill(value: string | null | undefined): string {
	if (!value) {
		return '';
	}

	const trimmed = value.trim().toLowerCase();

	return trimmed.includes('@') ? trimmed : '';
}
