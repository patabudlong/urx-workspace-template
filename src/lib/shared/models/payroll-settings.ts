import type { ObjectId } from 'mongodb';
import type { PayFrequency, WeekStartDay } from '$lib/shared/payroll/frequency';
import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import type { PayrollDeductionType } from '$lib/shared/payroll/deductions';
import type { PayrollJobTitle } from '$lib/shared/payroll/job-titles';
import type { PayrollTimezone } from '$lib/shared/payroll/timezone';

export type PayrollSettingsDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	payFrequency: PayFrequency;
	timezone: PayrollTimezone;
	currency: PayrollCurrency;
	weekStartDay: WeekStartDay | null;
	periodAnchorDate: string | null;
	deductionTypes: PayrollDeductionType[];
	jobTitles: PayrollJobTitle[];
	createdAt: Date;
	updatedAt: Date;
};

export type PayrollSettingsDto = {
	workspaceId: string;
	payFrequency: PayFrequency;
	timezone: PayrollTimezone;
	currency: PayrollCurrency;
	weekStartDay: WeekStartDay | null;
	periodAnchorDate: string | null;
	deductionTypes: PayrollDeductionType[];
	jobTitles: PayrollJobTitle[];
	configured: boolean;
	updatedAt: string | null;
};
