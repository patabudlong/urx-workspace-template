import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import { centsToMajorUnits } from '$lib/shared/payroll/format';
import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';

export type PayslipEmployeeNameParts = {
	firstName: string;
	middleName: string | null;
	lastName: string;
};

export function getPayslipEmployeeNameParts(payslip: PayrollPayslipDto): PayslipEmployeeNameParts {
	return {
		firstName: payslip.employeeFirstName,
		middleName: payslip.employeeInitialName?.trim() || null,
		lastName: payslip.employeeLastName
	};
}

export function formatPayslipMoney(cents: number, currency: PayrollCurrency): string {
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency,
		maximumFractionDigits: currency === 'JPY' ? 0 : 2
	}).format(centsToMajorUnits(cents, currency));
}

export function formatPayslipPeriod(payslip: PayrollPayslipDto): string {
	const start = new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(new Date(payslip.periodStart));

	const end = new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(new Date(payslip.periodEnd));

	return `${start} – ${end}`;
}

export function formatPayslipGeneratedAt(date: Date = new Date()): string {
	return new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	}).format(date);
}

export function formatWorkedHours(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;

	if (remainder === 0) {
		return `${hours}h`;
	}

	return `${hours}h ${remainder}m`;
}
