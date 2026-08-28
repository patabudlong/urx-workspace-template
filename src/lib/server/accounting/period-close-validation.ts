import {
	getAccountingPeriodForWorkspace,
	getFirstFiscalPeriodForWorkspace
} from '$lib/server/repositories/accounting-periods';
import {
	countJournalEntriesForPeriod,
	hasOpeningBalanceForPeriod
} from '$lib/server/repositories/accounting-journal-entries';
import {
	ACCOUNTING_PERIOD_CLOSE_EMPTY_MESSAGE,
	ACCOUNTING_PERIOD_CLOSE_MISSING_OPENING_BALANCE_MESSAGE,
	ACCOUNTING_PERIOD_CLOSE_NOT_OPEN_MESSAGE
} from '$lib/shared/accounting/messages';

export type PeriodCloseValidationResult =
	| { ok: true }
	| { ok: false; message: string };

export async function validateAccountingPeriodClose(input: {
	workspaceId: string;
	periodId: string;
}): Promise<PeriodCloseValidationResult> {
	const period = await getAccountingPeriodForWorkspace(input);

	if (!period) {
		return { ok: false, message: 'Fiscal period not found.' };
	}

	if (period.status !== 'open') {
		return { ok: false, message: ACCOUNTING_PERIOD_CLOSE_NOT_OPEN_MESSAGE };
	}

	const journalCount = await countJournalEntriesForPeriod(input);

	if (journalCount === 0) {
		return { ok: false, message: ACCOUNTING_PERIOD_CLOSE_EMPTY_MESSAGE };
	}

	const firstPeriod = await getFirstFiscalPeriodForWorkspace(input.workspaceId);

	if (firstPeriod?.id === input.periodId) {
		const hasOpeningBalance = await hasOpeningBalanceForPeriod(input);

		if (!hasOpeningBalance) {
			return { ok: false, message: ACCOUNTING_PERIOD_CLOSE_MISSING_OPENING_BALANCE_MESSAGE };
		}
	}

	return { ok: true };
}
