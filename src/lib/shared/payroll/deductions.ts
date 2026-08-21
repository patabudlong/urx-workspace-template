export const PAYROLL_DEDUCTION_KINDS = ['fixed', 'percentage'] as const;

export type PayrollDeductionKind = (typeof PAYROLL_DEDUCTION_KINDS)[number];

export const PAYROLL_DEDUCTION_KIND_LABELS: Record<PayrollDeductionKind, string> = {
	fixed: 'Fixed amount',
	percentage: 'Percentage of pay'
};

export type PayrollDeductionType = {
	id: string;
	name: string;
	kind: PayrollDeductionKind;
	defaultAmountCents: number;
	defaultRateBasisPoints: number;
	isActive: boolean;
};

export type PayrollEmployeeDeduction = {
	typeId: string;
	amountCents: number | null;
	rateBasisPoints: number | null;
	isActive: boolean;
};

export const PH_PAYROLL_DEDUCTION_PRESETS: Array<Pick<PayrollDeductionType, 'name' | 'kind'>> = [
	{ name: 'SSS', kind: 'fixed' },
	{ name: 'PhilHealth', kind: 'fixed' },
	{ name: 'Pag-IBIG', kind: 'fixed' },
	{ name: 'Withholding tax', kind: 'percentage' },
	{ name: 'Salary loan', kind: 'fixed' }
];

export function createDeductionTypeId(): string {
	return crypto.randomUUID();
}

export function percentToBasisPoints(percent: number): number {
	return Math.round(percent * 100);
}

export function basisPointsToPercent(basisPoints: number): number {
	return basisPoints / 100;
}

export function normalizePayrollDeductionTypes(
	types: PayrollDeductionType[] | undefined | null
): PayrollDeductionType[] {
	if (!types?.length) {
		return [];
	}

	return types.map((type) => ({
		id: type.id,
		name: type.name.trim(),
		kind: type.kind === 'percentage' ? 'percentage' : 'fixed',
		defaultAmountCents: Math.max(0, Math.round(type.defaultAmountCents ?? 0)),
		defaultRateBasisPoints: Math.max(0, Math.round(type.defaultRateBasisPoints ?? 0)),
		isActive: type.isActive !== false
	}));
}

export function getActivePayrollDeductionTypes(types: PayrollDeductionType[]): PayrollDeductionType[] {
	return normalizePayrollDeductionTypes(types).filter((type) => type.isActive);
}

export function buildEmployeeDeductionFormDefaults(
	types: PayrollDeductionType[]
): Array<{
	typeId: string;
	enabled: boolean;
	amount: number;
	ratePercent: number;
}> {
	return getActivePayrollDeductionTypes(types).map((type) => ({
		typeId: type.id,
		enabled: false,
		amount: type.kind === 'fixed' ? type.defaultAmountCents / 100 : 0,
		ratePercent: type.kind === 'percentage' ? basisPointsToPercent(type.defaultRateBasisPoints) : 0
	}));
}
