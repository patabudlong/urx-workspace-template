export const PAYROLL_CURRENCIES = [
	{ value: 'PHP', label: 'Philippine Peso (PHP)', symbol: '₱' },
	{ value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
	{ value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
	{ value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
	{ value: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
	{ value: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'CA$' },
	{ value: 'SGD', label: 'Singapore Dollar (SGD)', symbol: 'S$' },
	{ value: 'HKD', label: 'Hong Kong Dollar (HKD)', symbol: 'HK$' },
	{ value: 'JPY', label: 'Japanese Yen (JPY)', symbol: '¥' },
	{ value: 'INR', label: 'Indian Rupee (INR)', symbol: '₹' },
	{ value: 'AED', label: 'UAE Dirham (AED)', symbol: 'AED' },
	{ value: 'NZD', label: 'New Zealand Dollar (NZD)', symbol: 'NZ$' }
] as const;

export const PAYROLL_CURRENCY_VALUES = PAYROLL_CURRENCIES.map((currency) => currency.value);

export type PayrollCurrency = (typeof PAYROLL_CURRENCY_VALUES)[number];

export const DEFAULT_PAYROLL_CURRENCY: PayrollCurrency = 'PHP';

const PAYROLL_CURRENCY_SET = new Set<string>(PAYROLL_CURRENCY_VALUES);

export function isAcceptedPayrollCurrency(value: string): value is PayrollCurrency {
	return PAYROLL_CURRENCY_SET.has(value);
}

export function resolvePayrollCurrency(
	value: string,
	fallback: PayrollCurrency = DEFAULT_PAYROLL_CURRENCY
): PayrollCurrency {
	const trimmed = value.trim().toUpperCase();
	return isAcceptedPayrollCurrency(trimmed) ? trimmed : fallback;
}

export function getPayrollCurrencyLabel(value: PayrollCurrency): string {
	return PAYROLL_CURRENCIES.find((currency) => currency.value === value)?.label ?? value;
}
