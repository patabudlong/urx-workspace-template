import { getAccountingSettingsForWorkspace } from '$lib/server/repositories/accounting-settings';
import {
	getAccountingAccountsByCodes,
	seedFiscalYearPeriodsIfMissing
} from '$lib/server/repositories/accounting-accounts';
import {
	createAccountingJournalEntryForWorkspace,
	hasAccountingJournalForReference
} from '$lib/server/repositories/accounting-journal-entries';
import { buildTrialBalanceForFiscalYear } from '$lib/server/repositories/accounting-trial-balance';
import type { AccountingPeriodDto } from '$lib/shared/models/accounting-period';
import {
	getFiscalYearAnchorYear,
	isFiscalYearEndPeriod
} from '$lib/shared/accounting/fiscal-year';
import { PAYROLL_JOURNAL_ACCOUNT_CODES } from '$lib/shared/accounting/ph/payroll-account-mapping';
import type { AccountType } from '$lib/shared/accounting/core/account-types';

type FiscalYearRolloverPhase = 'before_close' | 'after_close';

export async function handleFiscalYearRolloverOnPeriodClose(input: {
	workspaceId: string;
	period: AccountingPeriodDto;
	userId?: string;
	phase: FiscalYearRolloverPhase;
}): Promise<void> {
	const settings = await getAccountingSettingsForWorkspace(input.workspaceId);

	if (!isFiscalYearEndPeriod(input.period.month, settings.fiscalYearStartMonth)) {
		return;
	}

	if (input.phase === 'before_close' && input.userId) {
		await postFiscalYearCloseJournal({
			workspaceId: input.workspaceId,
			period: input.period,
			userId: input.userId,
			fiscalYearStartMonth: settings.fiscalYearStartMonth
		});
	}

	if (input.phase === 'after_close') {
		const anchorYear = getFiscalYearAnchorYear(
			input.period.year,
			input.period.month,
			settings.fiscalYearStartMonth
		);

		await seedFiscalYearPeriodsIfMissing({
			workspaceId: input.workspaceId,
			anchorYear: anchorYear + 1,
			fiscalYearStartMonth: settings.fiscalYearStartMonth
		});
	}
}

async function postFiscalYearCloseJournal(input: {
	workspaceId: string;
	period: AccountingPeriodDto;
	userId: string;
	fiscalYearStartMonth: number;
}): Promise<void> {
	const anchorYear = getFiscalYearAnchorYear(
		input.period.year,
		input.period.month,
		input.fiscalYearStartMonth
	);
	const reference = `fiscal-year-close:${anchorYear}`;

	if (
		await hasAccountingJournalForReference({
			workspaceId: input.workspaceId,
			source: 'fiscal_year_close',
			reference
		})
	) {
		return;
	}

	const trialBalance = await buildTrialBalanceForFiscalYear({
		workspaceId: input.workspaceId,
		anchorYear,
		fiscalYearStartMonth: input.fiscalYearStartMonth
	});

	if (!trialBalance) {
		return;
	}

	const plRows = trialBalance.rows.filter(
		(row) => row.accountType === 'revenue' || row.accountType === 'expense'
	);

	if (plRows.every((row) => row.balanceCents === 0)) {
		return;
	}

	const accounts = await getAccountingAccountsByCodes({
		workspaceId: input.workspaceId,
		codes: [PAYROLL_JOURNAL_ACCOUNT_CODES.retainedEarnings]
	});
	const retainedEarnings = accounts.get(PAYROLL_JOURNAL_ACCOUNT_CODES.retainedEarnings);

	if (!retainedEarnings) {
		return;
	}

	const journalLines: Array<{
		accountId: string;
		description: string;
		debitCents: number;
		creditCents: number;
	}> = [];

	let retainedEarningsDebitCents = 0;
	let retainedEarningsCreditCents = 0;

	for (const row of plRows) {
		if (row.balanceCents === 0) {
			continue;
		}

		const accountType = row.accountType as AccountType;

		if (accountType === 'revenue') {
			if (row.balanceCents > 0) {
				journalLines.push({
					accountId: row.accountId,
					description: 'Close revenue to retained earnings',
					debitCents: row.balanceCents,
					creditCents: 0
				});
				retainedEarningsCreditCents += row.balanceCents;
			} else {
				const amount = -row.balanceCents;
				journalLines.push({
					accountId: row.accountId,
					description: 'Close revenue deficit to retained earnings',
					debitCents: 0,
					creditCents: amount
				});
				retainedEarningsDebitCents += amount;
			}
		} else if (accountType === 'expense') {
			if (row.balanceCents > 0) {
				journalLines.push({
					accountId: row.accountId,
					description: 'Close expense to retained earnings',
					debitCents: 0,
					creditCents: row.balanceCents
				});
				retainedEarningsDebitCents += row.balanceCents;
			} else {
				const amount = -row.balanceCents;
				journalLines.push({
					accountId: row.accountId,
					description: 'Close expense credit to retained earnings',
					debitCents: amount,
					creditCents: 0
				});
				retainedEarningsCreditCents += amount;
			}
		}
	}

	if (retainedEarningsCreditCents > retainedEarningsDebitCents) {
		journalLines.push({
			accountId: retainedEarnings.id,
			description: 'Fiscal year net income',
			debitCents: 0,
			creditCents: retainedEarningsCreditCents - retainedEarningsDebitCents
		});
	} else if (retainedEarningsDebitCents > retainedEarningsCreditCents) {
		journalLines.push({
			accountId: retainedEarnings.id,
			description: 'Fiscal year net loss',
			debitCents: retainedEarningsDebitCents - retainedEarningsCreditCents,
			creditCents: 0
		});
	}

	if (journalLines.length < 2) {
		return;
	}

	await createAccountingJournalEntryForWorkspace({
		workspaceId: input.workspaceId,
		userId: input.userId,
		data: {
			periodId: input.period.id,
			entryDate: input.period.endDate,
			reference,
			memo: `Fiscal year close ${anchorYear}`,
			source: 'fiscal_year_close',
			lines: journalLines
		}
	});
}
