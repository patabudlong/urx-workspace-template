import type { ObjectId } from 'mongodb';
import type { PayrollDeductionKind } from '$lib/shared/payroll/deductions';
import type { PayrollPayType } from '$lib/shared/payroll/pay-rate';

export type PayrollPayslipDeductionLine = {
	typeId: string;
	name: string;
	kind: PayrollDeductionKind;
	amountCents: number;
};

export type PayrollPayslipEarningLine = {
	id: string;
	name: string;
	amountCents: number;
};

export type PayrollPayslipDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	runId: ObjectId;
	employeeId: ObjectId;
	runTitle: string;
	periodStart: Date;
	periodEnd: Date;
	employeeFirstName: string;
	employeeInitialName?: string | null;
	employeeLastName: string;
	employeeCode: string | null;
	employeeTin: string | null;
	employeeDepartment: string | null;
	jobTitle: string | null;
	payType: PayrollPayType;
	payRateCents: number;
	basePayCents: number;
	overtimePayCents: number;
	holidayPayCents: number;
	restDayPayCents: number;
	nightShiftPayCents: number;
	otherEarningsCents: number;
	otherEarningLines: PayrollPayslipEarningLine[];
	grossCents: number;
	deductionLines: PayrollPayslipDeductionLine[];
	totalDeductionsCents: number;
	netCents: number;
	workedMinutes: number;
	workDays: number;
	paidMinutes: number;
	paidDays: number;
	ytdGrossCents: number | null;
	ytdNetCents: number | null;
	createdAt: Date;
	updatedAt: Date;
};

export type PayrollPayslipDto = {
	id: string;
	workspaceId: string;
	runId: string;
	employeeId: string;
	runTitle: string;
	periodStart: string;
	periodEnd: string;
	employeeFirstName: string;
	employeeInitialName?: string | null;
	employeeLastName: string;
	employeeFullName: string;
	employeeCode: string | null;
	employeeTin: string | null;
	employeeDepartment: string | null;
	jobTitle: string | null;
	payType: PayrollPayType;
	payRateCents: number;
	basePayCents: number;
	overtimePayCents: number;
	holidayPayCents: number;
	restDayPayCents: number;
	nightShiftPayCents: number;
	otherEarningsCents: number;
	otherEarningLines: PayrollPayslipEarningLine[];
	grossCents: number;
	deductionLines: PayrollPayslipDeductionLine[];
	totalDeductionsCents: number;
	netCents: number;
	workedMinutes: number;
	workDays: number;
	paidMinutes: number;
	paidDays: number;
	ytdGrossCents: number | null;
	ytdNetCents: number | null;
	createdAt: string;
	updatedAt: string;
};

export const PAYSLIP_EARNINGS_DEFAULTS = {
	overtimePayCents: 0,
	holidayPayCents: 0,
	restDayPayCents: 0,
	nightShiftPayCents: 0,
	otherEarningsCents: 0,
	otherEarningLines: [] as PayrollPayslipEarningLine[],
	ytdGrossCents: null as number | null,
	ytdNetCents: null as number | null
};
