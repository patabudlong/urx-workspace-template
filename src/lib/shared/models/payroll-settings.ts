import type { ObjectId } from 'mongodb';
import type { PayFrequency, WeekStartDay } from '$lib/shared/payroll/frequency';
import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import type { PayrollTimezone } from '$lib/shared/payroll/timezone';

export type PayrollSettingsDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	payFrequency: PayFrequency;
	timezone: PayrollTimezone;
	currency: PayrollCurrency;
	weekStartDay: WeekStartDay | null;
	periodAnchorDate: string | null;
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
	configured: boolean;
	updatedAt: string | null;
};
