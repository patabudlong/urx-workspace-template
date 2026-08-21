export const PAYROLL_PAY_TYPES = ['hourly', 'monthly'] as const;

export type PayrollPayType = (typeof PAYROLL_PAY_TYPES)[number];

export const PAYROLL_PAY_TYPE_LABELS: Record<PayrollPayType, string> = {
	hourly: 'Per hour',
	monthly: 'Per month'
};

/** Map legacy stored values to the current pay type enum. */
export function normalizePayrollPayType(value: string): PayrollPayType {
	if (value === 'hourly') {
		return 'hourly';
	}

	return 'monthly';
}
