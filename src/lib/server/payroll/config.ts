import { env } from '$env/dynamic/private';
import { DEFAULT_PAYROLL_CURRENCY, resolvePayrollCurrency } from '$lib/shared/payroll/currency';
import { DEFAULT_PAYROLL_TIMEZONE, resolvePayrollTimezone } from '$lib/shared/payroll/timezone';

export function getDefaultPayrollTimezone() {
	const value = env.PAYROLL_DEFAULT_TIMEZONE?.trim();
	return resolvePayrollTimezone(value || DEFAULT_PAYROLL_TIMEZONE);
}

export function getDefaultPayrollCurrency() {
	const value = env.PAYROLL_DEFAULT_CURRENCY?.trim();
	return resolvePayrollCurrency(value || DEFAULT_PAYROLL_CURRENCY);
}
