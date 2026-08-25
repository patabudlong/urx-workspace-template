import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import type { PayrollPayType } from '$lib/shared/payroll/pay-rate';

export function formatPayRateCents(
	cents: number,
	payType: PayrollPayType,
	currency: PayrollCurrency
): string {
	const amount = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency,
		maximumFractionDigits: currency === 'JPY' ? 0 : 2
	}).format(cents / 100);

	return payType === 'hourly'
		? `${amount}/hr`
		: payType === 'daily'
			? `${amount}/day`
			: `${amount}/mo`;
}

export function dollarsToCents(value: number, currency: PayrollCurrency): number {
	if (currency === 'JPY') {
		return Math.round(value);
	}

	return Math.round(value * 100);
}

export function centsToMajorUnits(cents: number, currency: PayrollCurrency): number {
	if (currency === 'JPY') {
		return cents;
	}

	return cents / 100;
}
