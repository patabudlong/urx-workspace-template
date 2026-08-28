const PHP_FORMATTER = new Intl.NumberFormat('en-PH', {
	style: 'currency',
	currency: 'PHP',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

export function formatPhpFromCents(centavos: number): string {
	return PHP_FORMATTER.format(centavos / 100);
}

export function parsePhpToCents(value: string): number | null {
	const normalized = value.replace(/[^\d.-]/g, '').trim();
	if (!normalized) {
		return null;
	}

	const amount = Number(normalized);
	if (!Number.isFinite(amount)) {
		return null;
	}

	return Math.round(amount * 100);
}

export function centsToInputValue(centavos: number): string {
	return (centavos / 100).toFixed(2);
}
