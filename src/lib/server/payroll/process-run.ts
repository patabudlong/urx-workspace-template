import { listDtrDaysForWorkspace, lockDtrDaysForPayPeriod } from '$lib/server/repositories/dtr-days';
import { getDtrSettingsForWorkspace } from '$lib/server/repositories/dtr-settings';
import {
	listActivePayrollEmployeeDocumentsForWorkspace,
	syncPayrollEmployeeUserLinksForWorkspace
} from '$lib/server/repositories/payroll-employees';
import { replacePayrollPayslipsForRun } from '$lib/server/repositories/payroll-payslips';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import {
	getPayrollRunDocumentForWorkspace,
	payrollRunPeriodDates,
	updatePayrollRunStatus
} from '$lib/server/repositories/payroll-runs';
import {
	computeEmployeeEarnings,
	computePayslipDeductions
} from '$lib/shared/payroll/calculation';
import type { PayrollPayslipDocument } from '$lib/shared/models/payroll-payslip';
import type { PayrollRunDto } from '$lib/shared/models/payroll-run';
import { ObjectId } from 'mongodb';

export type ProcessPayrollRunResult =
	| { ok: true; run: PayrollRunDto }
	| { ok: false; code: 'NOT_FOUND' | 'INVALID_STATUS' | 'FAILED' };

export async function processPayrollRunForWorkspace(input: {
	workspaceId: string;
	runId: string;
}): Promise<ProcessPayrollRunResult> {
	const run = await getPayrollRunDocumentForWorkspace({
		workspaceId: input.workspaceId,
		runId: input.runId
	});

	if (!run) {
		return { ok: false, code: 'NOT_FOUND' };
	}

	if (run.status !== 'draft' && run.status !== 'failed') {
		return { ok: false, code: 'INVALID_STATUS' };
	}

	const processing = await updatePayrollRunStatus({
		workspaceId: input.workspaceId,
		runId: input.runId,
		status: 'processing',
		expectedStatus: run.status
	});

	if (!processing) {
		return { ok: false, code: 'INVALID_STATUS' };
	}

	try {
		const { periodStart, periodEnd } = payrollRunPeriodDates(run);

		await syncPayrollEmployeeUserLinksForWorkspace(input.workspaceId);

		const [employees, settings, dtrSettings] = await Promise.all([
			listActivePayrollEmployeeDocumentsForWorkspace(input.workspaceId),
			getPayrollSettingsForWorkspace(input.workspaceId),
			getDtrSettingsForWorkspace(input.workspaceId)
		]);

		const standardWorkMinutes = dtrSettings.standardWorkMinutes > 0
			? dtrSettings.standardWorkMinutes
			: 480;

		const payslipWrites: Omit<PayrollPayslipDocument, '_id' | 'createdAt' | 'updatedAt'>[] = [];

		for (const employee of employees) {
			const dtrDays = await listDtrDaysForWorkspace({
				workspaceId: input.workspaceId,
				startDate: periodStart,
				endDate: periodEnd,
				employeeId: employee._id.toString()
			});

			const earnings = computeEmployeeEarnings({
				payType: employee.payType,
				payRateCents: employee.payRateCents,
				standardWorkMinutes,
				periodStart,
				periodEnd,
				dtrDays
			});

			const { deductionLines, totalDeductionsCents } = computePayslipDeductions({
				grossCents: earnings.grossCents,
				employeeDeductions: employee.deductions ?? [],
				deductionTypes: settings.deductionTypes
			});

			const netCents = Math.max(0, earnings.grossCents - totalDeductionsCents);

			payslipWrites.push({
				workspaceId: new ObjectId(input.workspaceId),
				runId: run._id,
				employeeId: employee._id,
				runTitle: run.title,
				periodStart: run.periodStart,
				periodEnd: run.periodEnd,
				employeeFirstName: employee.firstName,
				employeeLastName: employee.lastName,
				employeeCode: employee.employeeCode ?? null,
				jobTitle: employee.jobTitle ?? null,
				payType: employee.payType,
				payRateCents: employee.payRateCents,
				basePayCents: earnings.basePayCents,
				holidayPayCents: earnings.holidayPayCents,
				grossCents: earnings.grossCents,
				deductionLines,
				totalDeductionsCents,
				netCents,
				workedMinutes: earnings.workedMinutes,
				workDays: earnings.workDays
			});
		}

		await replacePayrollPayslipsForRun({
			workspaceId: input.workspaceId,
			runId: input.runId,
			payslips: payslipWrites
		});

		await lockDtrDaysForPayPeriod({
			workspaceId: input.workspaceId,
			startDate: periodStart,
			endDate: periodEnd,
			runId: input.runId
		});

		const completed = await updatePayrollRunStatus({
			workspaceId: input.workspaceId,
			runId: input.runId,
			status: 'completed',
			expectedStatus: 'processing'
		});

		if (!completed) {
			return { ok: false, code: 'FAILED' };
		}

		return { ok: true, run: completed };
	} catch {
		await updatePayrollRunStatus({
			workspaceId: input.workspaceId,
			runId: input.runId,
			status: 'failed',
			expectedStatus: 'processing'
		});

		return { ok: false, code: 'FAILED' };
	}
}
