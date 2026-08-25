import type { ObjectId } from 'mongodb';
import type { PayrollDeductionKind } from '$lib/shared/payroll/deductions';
import type { PayrollPayType } from '$lib/shared/payroll/pay-rate';

export type PayrollPayslipDeductionLine = {
	typeId: string;
	name: string;
	kind: PayrollDeductionKind;
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
	jobTitle: string | null;
	payType: PayrollPayType;
	payRateCents: number;
	basePayCents: number;
	holidayPayCents: number;
	grossCents: number;
	deductionLines: PayrollPayslipDeductionLine[];
	totalDeductionsCents: number;
	netCents: number;
	workedMinutes: number;
	workDays: number;
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
	jobTitle: string | null;
	payType: PayrollPayType;
	payRateCents: number;
	basePayCents: number;
	holidayPayCents: number;
	grossCents: number;
	deductionLines: PayrollPayslipDeductionLine[];
	totalDeductionsCents: number;
	netCents: number;
	workedMinutes: number;
	workDays: number;
	createdAt: string;
	updatedAt: string;
};
