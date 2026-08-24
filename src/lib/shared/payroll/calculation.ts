import type { PayrollDeductionType } from '$lib/shared/payroll/deductions';
import type { PayrollEmployeeDeduction } from '$lib/shared/payroll/deductions';
import { basisPointsToPercent } from '$lib/shared/payroll/deductions';
import type { PayrollPayType } from '$lib/shared/payroll/pay-rate';
import type { PayFrequency } from '$lib/shared/payroll/frequency';
import type { DtrDayDto } from '$lib/shared/models/dtr-day';
import type { PayrollPayslipDeductionLine } from '$lib/shared/models/payroll-payslip';
import {
	computeMonthlyAmountForPayPeriod,
	computeSalariedBasePayCents,
	PH_MONTHLY_WORKING_DAYS
} from '$lib/shared/payroll/ph-rates';

const MONTHLY_WORKING_DAYS = PH_MONTHLY_WORKING_DAYS;

export type PayrollEarningsBreakdown = {
	basePayCents: number;
	holidayPayCents: number;
	grossCents: number;
	workedMinutes: number;
	workDays: number;
};

export function computeHourlyRateCents(
	payType: PayrollPayType,
	payRateCents: number,
	standardWorkMinutes: number
): number {
	if (payType === 'hourly') {
		return payRateCents;
	}

	const hoursPerDay = standardWorkMinutes / 60;

	if (payType === 'daily') {
		if (hoursPerDay <= 0) {
			return 0;
		}

		return Math.round(payRateCents / hoursPerDay);
	}

	const dailyRateCents = Math.round(payRateCents / MONTHLY_WORKING_DAYS);

	if (hoursPerDay <= 0) {
		return 0;
	}

	return Math.round(dailyRateCents / hoursPerDay);
}

export function computeDailyRateCents(
	payType: PayrollPayType,
	payRateCents: number,
	standardWorkMinutes: number
): number {
	if (payType === 'hourly') {
		return Math.round(payRateCents * (standardWorkMinutes / 60));
	}

	if (payType === 'daily') {
		return payRateCents;
	}

	return Math.round(payRateCents / MONTHLY_WORKING_DAYS);
}

function computeMonthlyBasePayCents(
	payRateCents: number,
	periodStart: string,
	periodEnd: string,
	payFrequency: PayFrequency
): number {
	return computeSalariedBasePayCents({
		payRateCents,
		periodStart,
		periodEnd,
		payFrequency
	});
}

function isHolidayDay(day: DtrDayDto): boolean {
	return day.holidayPayPercent != null && day.holidayPayPercent > 0;
}

export function computeEmployeeEarnings(input: {
	payType: PayrollPayType;
	payRateCents: number;
	standardWorkMinutes: number;
	periodStart: string;
	periodEnd: string;
	payFrequency: PayFrequency;
	dtrDays: DtrDayDto[];
}): PayrollEarningsBreakdown {
	const hourlyRateCents = computeHourlyRateCents(
		input.payType,
		input.payRateCents,
		input.standardWorkMinutes
	);
	const dailyRateCents = computeDailyRateCents(
		input.payType,
		input.payRateCents,
		input.standardWorkMinutes
	);

	let basePayCents = 0;
	let holidayPayCents = 0;
	let workedMinutes = 0;
	let workDays = 0;

	if (input.payType === 'monthly') {
		basePayCents = computeMonthlyBasePayCents(
			input.payRateCents,
			input.periodStart,
			input.periodEnd,
			input.payFrequency
		);
	}

	for (const day of input.dtrDays) {
		if (day.workedMinutes > 0) {
			workedMinutes += day.workedMinutes;
			workDays += 1;
		}

		if (isHolidayDay(day)) {
			const payPercent = day.holidayPayPercent ?? 0;
			const worked = day.workedMinutes > 0;

			if (worked) {
				const hours = day.workedMinutes / 60;
				holidayPayCents += Math.round(hourlyRateCents * hours * (payPercent / 100));
			} else if (payPercent > 0) {
				holidayPayCents += Math.round(dailyRateCents * (payPercent / 100));
			}

			continue;
		}

		if (input.payType === 'hourly' && day.workedMinutes > 0) {
			basePayCents += Math.round(hourlyRateCents * (day.workedMinutes / 60));
		}

		if (input.payType === 'daily' && day.workedMinutes > 0) {
			basePayCents += input.payRateCents;
		}
	}

	const grossCents = basePayCents + holidayPayCents;

	return {
		basePayCents,
		holidayPayCents,
		grossCents,
		workedMinutes,
		workDays
	};
}

export function computePayslipDeductions(input: {
	grossCents: number;
	employeeDeductions: PayrollEmployeeDeduction[];
	deductionTypes: PayrollDeductionType[];
	periodStart: string;
	periodEnd: string;
	payFrequency: PayFrequency;
}): {
	deductionLines: PayrollPayslipDeductionLine[];
	totalDeductionsCents: number;
} {
	const typeById = new Map(input.deductionTypes.map((type) => [type.id, type]));
	const deductionLines: PayrollPayslipDeductionLine[] = [];

	for (const deduction of input.employeeDeductions) {
		if (!deduction.isActive) {
			continue;
		}

		const type = typeById.get(deduction.typeId);

		if (!type || !type.isActive) {
			continue;
		}

		let amountCents = 0;

		if (type.kind === 'fixed') {
			const monthlyAmountCents = deduction.amountCents ?? type.defaultAmountCents;
			amountCents = computeMonthlyAmountForPayPeriod({
				monthlyAmountCents,
				periodStart: input.periodStart,
				periodEnd: input.periodEnd,
				payFrequency: input.payFrequency
			});
		} else {
			const basisPoints = deduction.rateBasisPoints ?? type.defaultRateBasisPoints;
			amountCents = Math.round((input.grossCents * basisPoints) / 10_000);
		}

		if (amountCents <= 0) {
			continue;
		}

		deductionLines.push({
			typeId: type.id,
			name: type.name,
			kind: type.kind,
			amountCents
		});
	}

	const totalDeductionsCents = deductionLines.reduce((sum, line) => sum + line.amountCents, 0);

	return { deductionLines, totalDeductionsCents };
}

export function formatDeductionLineLabel(line: PayrollPayslipDeductionLine): string {
	if (line.kind === 'percentage') {
		return line.name;
	}

	return line.name;
}

export function formatDeductionRateHint(
	line: PayrollPayslipDeductionLine,
	grossCents: number
): string | null {
	if (line.kind !== 'percentage' || grossCents <= 0) {
		return null;
	}

	const percent = (line.amountCents / grossCents) * 100;
	return `${basisPointsToPercent(Math.round(percent * 100)).toFixed(2)}%`;
}
