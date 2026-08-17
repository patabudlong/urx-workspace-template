export function formatPayRateCents(cents: number, payType: 'salary' | 'hourly'): string {
	const amount = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 2
	}).format(cents / 100);

	return payType === 'hourly' ? `${amount}/hr` : `${amount}/yr`;
}

export function dollarsToCents(value: number): number {
	return Math.round(value * 100);
}
