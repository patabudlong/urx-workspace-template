import type { PayrollPayType } from '$lib/shared/payroll/pay-rate';
import { normalizePayrollPayType } from '$lib/shared/payroll/pay-rate';
import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import { centsToMajorUnits } from '$lib/shared/payroll/format';

export type PayrollJobTitle = {
	id: string;
	name: string;
	payType: PayrollPayType;
	payRateCents: number;
	isActive: boolean;
};

export function createJobTitleId(): string {
	return crypto.randomUUID();
}

export function normalizePayrollJobTitles(
	titles: PayrollJobTitle[] | undefined | null
): PayrollJobTitle[] {
	if (!titles?.length) {
		return [];
	}

	return titles.map((title) => ({
		id: title.id,
		name: title.name.trim(),
		payType: normalizePayrollPayType(title.payType),
		payRateCents: Math.max(0, Math.round(title.payRateCents ?? 0)),
		isActive: title.isActive !== false
	}));
}

export function getActivePayrollJobTitles(titles: PayrollJobTitle[]): PayrollJobTitle[] {
	return normalizePayrollJobTitles(titles).filter((title) => title.isActive);
}

export function findPayrollJobTitleByName(
	titles: PayrollJobTitle[],
	name: string
): PayrollJobTitle | undefined {
	const normalized = name.trim().toLowerCase();

	if (!normalized) {
		return undefined;
	}

	return getActivePayrollJobTitles(titles).find(
		(title) => title.name.trim().toLowerCase() === normalized
	);
}

export type PayrollJobTitleOption = {
	id: string;
	name: string;
	payType: PayrollPayType;
	payRate: number;
};

export function mapActiveJobTitlesForEmployeeForm(
	titles: PayrollJobTitle[],
	currency: PayrollCurrency
): PayrollJobTitleOption[] {
	return getActivePayrollJobTitles(titles).map((title) => ({
		id: title.id,
		name: title.name,
		payType: title.payType,
		payRate: centsToMajorUnits(title.payRateCents, currency)
	}));
}
