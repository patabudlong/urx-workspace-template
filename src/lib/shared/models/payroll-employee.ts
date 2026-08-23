import type { ObjectId } from 'mongodb';
import type { PayrollEmployeeDeduction } from '$lib/shared/payroll/deductions';
import type { PayrollPayType } from '$lib/shared/payroll/pay-rate';

export type PayrollEmployeeDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	firstName: string;
	lastName: string;
	email: string | null;
	jobTitle: string | null;
	employeeCode: string | null;
	photoUrl: string | null;
	payType: PayrollPayType;
	payRateCents: number;
	deductions: PayrollEmployeeDeduction[];
	workScheduleId: ObjectId | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type PayrollEmployeeDto = {
	id: string;
	workspaceId: string;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string | null;
	jobTitle: string | null;
	employeeCode: string | null;
	photoUrl: string | null;
	payType: PayrollPayType;
	payRateCents: number;
	deductions: PayrollEmployeeDeduction[];
	workScheduleId: string | null;
	workScheduleName: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};
