import type { PayrollPayslipDeductionLine } from '$lib/shared/models/payroll-payslip';
import type { PayrollDeductionType, PayrollEmployeeDeduction } from '$lib/shared/payroll/deductions';
import { resolvePhDeductionIconKey } from '$lib/shared/payroll/deduction-icon-names';

export function isWithholdingTaxDeductionName(name: string): boolean {
	return resolvePhDeductionIconKey(name) === 'withholding-tax';
}

export function shouldIncludeZeroAmountDeductionLine(name: string): boolean {
	return isWithholdingTaxDeductionName(name);
}

/** Ensure configured zero-amount withholding tax appears on payslip views. */
export function enrichPayslipDeductionLines(input: {
	lines: PayrollPayslipDeductionLine[];
	employeeDeductions: PayrollEmployeeDeduction[];
	deductionTypes: PayrollDeductionType[];
}): PayrollPayslipDeductionLine[] {
	const typeById = new Map(input.deductionTypes.map((type) => [type.id, type]));
	const enriched = [...input.lines];

	for (const employeeDeduction of input.employeeDeductions) {
		if (!employeeDeduction.isActive) {
			continue;
		}

		const type = typeById.get(employeeDeduction.typeId);

		if (!type?.isActive || !shouldIncludeZeroAmountDeductionLine(type.name)) {
			continue;
		}

		const alreadyPresent = enriched.some(
			(line) =>
				line.typeId === type.id || isWithholdingTaxDeductionName(line.name)
		);

		if (alreadyPresent) {
			continue;
		}

		enriched.push({
			typeId: type.id,
			name: type.name,
			kind: type.kind,
			amountCents: 0
		});
	}

	return enriched;
}
