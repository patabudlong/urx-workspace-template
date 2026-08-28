import { isAccountingActiveForWorkspace } from '$lib/server/accounting/integration';
import { getPayrollRunDocumentForWorkspace } from '$lib/server/repositories/payroll-runs';
import { listPayrollPayslipsForRun } from '$lib/server/repositories/payroll-payslips';
import { getAccountingAccountsByCodes } from '$lib/server/repositories/accounting-accounts';
import { findAccountingPeriodForDate } from '$lib/server/repositories/accounting-periods';
import {
	createAccountingJournalEntryForWorkspace,
	hasAccountingJournalForReference
} from '$lib/server/repositories/accounting-journal-entries';
import {
	PAYROLL_JOURNAL_ACCOUNT_CODES,
	resolvePayrollDeductionAccountCode
} from '$lib/shared/accounting/ph/payroll-account-mapping';

export type PostPayrollJournalResult =
	| { posted: true; entryId: string }
	| { posted: false; reason: string };

export async function postPayrollJournalForCompletedRun(input: {
	workspaceId: string;
	runId: string;
	userId: string;
}): Promise<PostPayrollJournalResult> {
	if (!(await isAccountingActiveForWorkspace(input.workspaceId))) {
		return { posted: false, reason: 'accounting_not_active' };
	}

	const reference = `payroll-run:${input.runId}`;

	if (
		await hasAccountingJournalForReference({
			workspaceId: input.workspaceId,
			source: 'payroll',
			reference
		})
	) {
		return { posted: false, reason: 'already_posted' };
	}

	const run = await getPayrollRunDocumentForWorkspace({
		workspaceId: input.workspaceId,
		runId: input.runId
	});

	if (!run) {
		return { posted: false, reason: 'run_not_found' };
	}

	const payslips = await listPayrollPayslipsForRun({
		workspaceId: input.workspaceId,
		runId: input.runId,
		page: 1,
		limit: 5000
	});

	if (payslips.total === 0) {
		return { posted: false, reason: 'no_payslips' };
	}

	const periodEnd = run.periodEnd.toISOString().slice(0, 10);
	const period = await findAccountingPeriodForDate({
		workspaceId: input.workspaceId,
		date: periodEnd
	});

	if (!period) {
		return { posted: false, reason: 'period_not_found' };
	}

	if (period.status !== 'open') {
		return { posted: false, reason: 'period_not_open' };
	}

	let totalGrossCents = 0;
	let totalNetCents = 0;
	const creditTotalsByCode = new Map<string, number>();

	for (const payslip of payslips.items) {
		totalGrossCents += payslip.grossCents;
		totalNetCents += payslip.netCents;

		for (const deduction of payslip.deductionLines) {
			if (deduction.amountCents <= 0) {
				continue;
			}

			const accountCode = resolvePayrollDeductionAccountCode(deduction.name);
			creditTotalsByCode.set(
				accountCode,
				(creditTotalsByCode.get(accountCode) ?? 0) + deduction.amountCents
			);
		}
	}

	const requiredCodes = [
		PAYROLL_JOURNAL_ACCOUNT_CODES.salaries,
		PAYROLL_JOURNAL_ACCOUNT_CODES.cashInBank,
		...creditTotalsByCode.keys()
	];
	const accounts = await getAccountingAccountsByCodes({
		workspaceId: input.workspaceId,
		codes: requiredCodes
	});

	const salariesAccount = accounts.get(PAYROLL_JOURNAL_ACCOUNT_CODES.salaries);
	const cashAccount = accounts.get(PAYROLL_JOURNAL_ACCOUNT_CODES.cashInBank);

	if (!salariesAccount || !cashAccount) {
		return { posted: false, reason: 'missing_core_accounts' };
	}

	const journalLines: Array<{
		accountId: string;
		description: string;
		debitCents: number;
		creditCents: number;
	}> = [];

	if (totalGrossCents > 0) {
		journalLines.push({
			accountId: salariesAccount.id,
			description: `Payroll gross — ${run.title}`,
			debitCents: totalGrossCents,
			creditCents: 0
		});
	}

	for (const [code, amountCents] of creditTotalsByCode) {
		const account = accounts.get(code);

		if (!account || amountCents <= 0) {
			continue;
		}

		journalLines.push({
			accountId: account.id,
			description: `Payroll deductions — ${run.title}`,
			debitCents: 0,
			creditCents: amountCents
		});
	}

	if (totalNetCents > 0) {
		journalLines.push({
			accountId: cashAccount.id,
			description: `Net payroll — ${run.title}`,
			debitCents: 0,
			creditCents: totalNetCents
		});
	}

	if (journalLines.length < 2) {
		return { posted: false, reason: 'no_journal_lines' };
	}

	const entry = await createAccountingJournalEntryForWorkspace({
		workspaceId: input.workspaceId,
		userId: input.userId,
		data: {
			periodId: period.id,
			entryDate: periodEnd,
			reference,
			memo: `Payroll: ${run.title}`,
			source: 'payroll',
			lines: journalLines
		}
	});

	return { posted: true, entryId: entry.id };
}
