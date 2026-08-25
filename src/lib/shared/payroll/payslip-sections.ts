import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import { formatPayRateCents } from '$lib/shared/payroll/format';
import type { PayrollPayType } from '$lib/shared/payroll/pay-rate';
import { PAYROLL_PAY_TYPE_LABELS } from '$lib/shared/payroll/pay-rate';
import { resolvePhDeductionIconKey } from '$lib/shared/payroll/deduction-icon-names';
import {
	PAYSLIP_CONFIDENTIALITY_NOTICE,
	PAYSLIP_DOCUMENT_TITLE,
	PAYSLIP_DEDUCTION_LABELS,
	PAYSLIP_EARNING_LABELS,
	PAYSLIP_EMPLOYEE_FIELD_LABELS,
	PAYSLIP_REFERENCE_PREFIX,
	PAYSLIP_SECTION_LABELS,
	PAYSLIP_TOTAL_LABELS,
	PAYSLIP_VALIDATION_PREFIX
} from '$lib/shared/payroll/payslip-config';
import {
	formatPayslipMoney,
	formatWorkedHours,
	getPayslipEmployeeNameParts
} from '$lib/shared/payroll/payslip-format';
import type {
	PayrollPayslipDeductionLine,
	PayrollPayslipDto,
	PayrollPayslipEarningLine
} from '$lib/shared/models/payroll-payslip';

export type PayslipEmployeeField = {
	label: string;
	value: string;
};

export type PayslipAmountLine = {
	key: string;
	label: string;
	amountCents: number;
	emphasize?: boolean;
};

export type PayslipDisplayContext = {
	companyName: string;
	referenceNumber: string;
	validationReference: string;
	showYtdTotals: boolean;
};

export function resolvePayslipCompanyName(input: {
	registeredCompanyName?: string | null;
	workspaceName: string;
}): string {
	const registered = input.registeredCompanyName?.trim();
	return registered || input.workspaceName.trim();
}

export function formatPayslipReferenceNumber(payslipId: string): string {
	const suffix = payslipId.replace(/[^a-f\d]/gi, '').slice(-8).toUpperCase();
	return `${PAYSLIP_REFERENCE_PREFIX}-${suffix || '00000000'}`;
}

export function formatPayslipValidationReference(payslipId: string): string {
	return `${PAYSLIP_VALIDATION_PREFIX}-${payslipId}`;
}

export function buildPayslipDisplayContext(input: {
	payslip: PayrollPayslipDto;
	workspaceName: string;
	registeredCompanyName?: string | null;
	showYtdTotals?: boolean;
}): PayslipDisplayContext {
	return {
		companyName: resolvePayslipCompanyName({
			registeredCompanyName: input.registeredCompanyName,
			workspaceName: input.workspaceName
		}),
		referenceNumber: formatPayslipReferenceNumber(input.payslip.id),
		validationReference: formatPayslipValidationReference(input.payslip.id),
		showYtdTotals: input.showYtdTotals === true
	};
}

export function buildPayslipEmployeeFields(payslip: PayrollPayslipDto): PayslipEmployeeField[] {
	const names = getPayslipEmployeeNameParts(payslip);
	const fullName = [names.firstName, names.middleName, names.lastName].filter(Boolean).join(' ');
	const positionOrDepartment =
		payslip.employeeDepartment?.trim() || payslip.jobTitle?.trim() || null;

	const fields: PayslipEmployeeField[] = [
		{
			label: PAYSLIP_EMPLOYEE_FIELD_LABELS.fullName,
			value: fullName
		}
	];

	if (payslip.employeeCode) {
		fields.push({
			label: PAYSLIP_EMPLOYEE_FIELD_LABELS.employeeNumber,
			value: payslip.employeeCode
		});
	}

	if (positionOrDepartment) {
		fields.push({
			label: PAYSLIP_EMPLOYEE_FIELD_LABELS.positionOrDepartment,
			value: positionOrDepartment
		});
	}

	if (payslip.employeeTin) {
		fields.push({
			label: PAYSLIP_EMPLOYEE_FIELD_LABELS.tin,
			value: payslip.employeeTin
		});
	}

	return fields;
}

export function formatPayslipDeductionLabel(name: string): string {
	const key = resolvePhDeductionIconKey(name);

	switch (key) {
		case 'sss':
			return PAYSLIP_DEDUCTION_LABELS.sss;
		case 'philhealth':
			return PAYSLIP_DEDUCTION_LABELS.philHealth;
		case 'pagibig':
			return PAYSLIP_DEDUCTION_LABELS.pagIbig;
		case 'withholding-tax':
			return PAYSLIP_DEDUCTION_LABELS.withholdingTax;
		default:
			return name;
	}
}

function formatDaysOrHoursPaid(payslip: PayrollPayslipDto, payType: PayrollPayType): string {
	if (payType === 'hourly') {
		return `${formatWorkedHours(payslip.paidMinutes)} (${payslip.paidDays} day(s))`;
	}

	if (payType === 'daily') {
		return `${payslip.paidDays} day(s)`;
	}

	return `${payslip.paidDays} day(s) in period`;
}

export function buildPayslipEarningLines(
	payslip: PayrollPayslipDto,
	currency: PayrollCurrency
): PayslipAmountLine[] {
	const lines: PayslipAmountLine[] = [
		{
			key: 'basic-pay',
			label: PAYSLIP_EARNING_LABELS.basicPay,
			amountCents: payslip.basePayCents
		},
		{
			key: 'days-hours-paid',
			label: PAYSLIP_EARNING_LABELS.daysOrHoursPaid,
			amountCents: 0
		}
	];

	const daysOrHoursLine = lines[1];
	daysOrHoursLine.label = `${PAYSLIP_EARNING_LABELS.daysOrHoursPaid}: ${formatDaysOrHoursPaid(payslip, payslip.payType)}`;
	daysOrHoursLine.amountCents = -1;

	if (payslip.overtimePayCents > 0) {
		lines.push({
			key: 'overtime',
			label: PAYSLIP_EARNING_LABELS.overtime,
			amountCents: payslip.overtimePayCents
		});
	}

	const holidayOrRestDayPayCents = payslip.holidayPayCents + payslip.restDayPayCents;

	if (holidayOrRestDayPayCents > 0) {
		lines.push({
			key: 'holiday-rest-day',
			label: PAYSLIP_EARNING_LABELS.holidayOrRestDayPay,
			amountCents: holidayOrRestDayPayCents
		});
	}

	if (payslip.nightShiftPayCents > 0) {
		lines.push({
			key: 'night-shift',
			label: PAYSLIP_EARNING_LABELS.nightShiftDifferential,
			amountCents: payslip.nightShiftPayCents
		});
	}

	for (const line of payslip.otherEarningLines) {
		if (line.amountCents > 0) {
			lines.push({
				key: `other-${line.id}`,
				label: line.name,
				amountCents: line.amountCents
			});
		}
	}

	if (payslip.otherEarningsCents > 0) {
		lines.push({
			key: 'other-compensation',
			label: PAYSLIP_EARNING_LABELS.otherCompensation,
			amountCents: payslip.otherEarningsCents
		});
	}

	lines.push({
		key: 'gross-pay',
		label: PAYSLIP_EARNING_LABELS.grossPay,
		amountCents: payslip.grossCents,
		emphasize: true
	});

	return lines;
}

export function buildPayslipDeductionLines(
	lines: PayrollPayslipDeductionLine[]
): PayslipAmountLine[] {
	return lines.map((line) => ({
		key: line.typeId,
		label: formatPayslipDeductionLabel(line.name),
		amountCents: line.amountCents
	}));
}

export function buildPayslipTotalLines(
	payslip: PayrollPayslipDto,
	showYtdTotals: boolean
): PayslipAmountLine[] {
	const totals: PayslipAmountLine[] = [
		{
			key: 'gross-pay',
			label: PAYSLIP_TOTAL_LABELS.grossPay,
			amountCents: payslip.grossCents
		},
		{
			key: 'total-deductions',
			label: PAYSLIP_TOTAL_LABELS.totalDeductions,
			amountCents: payslip.totalDeductionsCents
		},
		{
			key: 'net-pay',
			label: PAYSLIP_TOTAL_LABELS.netPay,
			amountCents: payslip.netCents,
			emphasize: true
		}
	];

	if (showYtdTotals && payslip.ytdGrossCents != null) {
		totals.push({
			key: 'ytd-gross',
			label: PAYSLIP_TOTAL_LABELS.ytdGrossPay,
			amountCents: payslip.ytdGrossCents
		});
	}

	if (showYtdTotals && payslip.ytdNetCents != null) {
		totals.push({
			key: 'ytd-net',
			label: PAYSLIP_TOTAL_LABELS.ytdNetPay,
			amountCents: payslip.ytdNetCents,
			emphasize: true
		});
	}

	return totals;
}

export function formatPayslipPayRateLabel(
	payRateCents: number,
	payType: PayrollPayType,
	currency: PayrollCurrency
): string {
	return `${formatPayRateCents(payRateCents, payType, currency)} (${PAYROLL_PAY_TYPE_LABELS[payType]})`;
}

export function isPayslipEarningInfoLine(line: PayslipAmountLine): boolean {
	return line.key === 'days-hours-paid';
}

export function formatPayslipEarningLineAmount(
	line: PayslipAmountLine,
	currency: PayrollCurrency
): string {
	if (isPayslipEarningInfoLine(line)) {
		return line.label.includes(':') ? line.label.split(': ').slice(1).join(': ') : '—';
	}

	return formatPayslipMoney(line.amountCents, currency);
}

export function formatPayslipEarningLineLabel(line: PayslipAmountLine): string {
	if (isPayslipEarningInfoLine(line)) {
		return PAYSLIP_EARNING_LABELS.daysOrHoursPaid;
	}

	return line.label;
}

export {
	PAYSLIP_CONFIDENTIALITY_NOTICE,
	PAYSLIP_DOCUMENT_TITLE,
	PAYSLIP_SECTION_LABELS,
	PAYSLIP_TOTAL_LABELS
};

export type { PayrollPayslipEarningLine };
