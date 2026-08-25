import type { PayrollPayslipDocument, PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
import { PAYSLIP_EARNINGS_DEFAULTS } from '$lib/shared/models/payroll-payslip';

export function normalizePayrollPayslipDocument(
	doc: PayrollPayslipDocument
): PayrollPayslipDocument {
	return {
		...doc,
		employeeTin: doc.employeeTin ?? null,
		employeeDepartment: doc.employeeDepartment ?? null,
		overtimePayCents: doc.overtimePayCents ?? PAYSLIP_EARNINGS_DEFAULTS.overtimePayCents,
		restDayPayCents: doc.restDayPayCents ?? PAYSLIP_EARNINGS_DEFAULTS.restDayPayCents,
		nightShiftPayCents: doc.nightShiftPayCents ?? PAYSLIP_EARNINGS_DEFAULTS.nightShiftPayCents,
		otherEarningsCents: doc.otherEarningsCents ?? PAYSLIP_EARNINGS_DEFAULTS.otherEarningsCents,
		otherEarningLines: doc.otherEarningLines ?? PAYSLIP_EARNINGS_DEFAULTS.otherEarningLines,
		paidMinutes: doc.paidMinutes ?? doc.workedMinutes,
		paidDays: doc.paidDays ?? doc.workDays,
		ytdGrossCents: doc.ytdGrossCents ?? PAYSLIP_EARNINGS_DEFAULTS.ytdGrossCents,
		ytdNetCents: doc.ytdNetCents ?? PAYSLIP_EARNINGS_DEFAULTS.ytdNetCents
	};
}

export function normalizePayrollPayslipDto(payslip: PayrollPayslipDto): PayrollPayslipDto {
	return {
		...payslip,
		employeeTin: payslip.employeeTin ?? null,
		employeeDepartment: payslip.employeeDepartment ?? null,
		overtimePayCents: payslip.overtimePayCents ?? PAYSLIP_EARNINGS_DEFAULTS.overtimePayCents,
		restDayPayCents: payslip.restDayPayCents ?? PAYSLIP_EARNINGS_DEFAULTS.restDayPayCents,
		nightShiftPayCents: payslip.nightShiftPayCents ?? PAYSLIP_EARNINGS_DEFAULTS.nightShiftPayCents,
		otherEarningsCents: payslip.otherEarningsCents ?? PAYSLIP_EARNINGS_DEFAULTS.otherEarningsCents,
		otherEarningLines: payslip.otherEarningLines ?? PAYSLIP_EARNINGS_DEFAULTS.otherEarningLines,
		paidMinutes: payslip.paidMinutes ?? payslip.workedMinutes,
		paidDays: payslip.paidDays ?? payslip.workDays,
		ytdGrossCents: payslip.ytdGrossCents ?? PAYSLIP_EARNINGS_DEFAULTS.ytdGrossCents,
		ytdNetCents: payslip.ytdNetCents ?? PAYSLIP_EARNINGS_DEFAULTS.ytdNetCents
	};
}
