import type { TrialBalanceDto } from '$lib/shared/models/accounting-journal-entry';
import { computeSignedBalanceCents, type AccountType } from '$lib/shared/accounting/core/account-types';
import { getAccountingJournalEntriesCollection } from '$lib/server/db/collections';
import { listAccountingAccountsForWorkspace } from '$lib/server/repositories/accounting-accounts';
import { getAccountingPeriodForWorkspace, listAccountingPeriodIdsForFiscalYear } from '$lib/server/repositories/accounting-periods';
import { ObjectId } from 'mongodb';

export async function buildTrialBalanceForWorkspace(input: {
	workspaceId: string;
	periodId: string;
}): Promise<TrialBalanceDto | null> {
	const period = await getAccountingPeriodForWorkspace({
		workspaceId: input.workspaceId,
		periodId: input.periodId
	});

	if (!period) {
		return null;
	}

	const [accounts, entries] = await Promise.all([
		listAccountingAccountsForWorkspace(input.workspaceId),
		getAccountingJournalEntriesCollection().then((collection) =>
			collection
				.find(
					{
						workspaceId: new ObjectId(input.workspaceId),
						periodId: new ObjectId(input.periodId)
					},
					{ projection: { lines: 1 } }
				)
				.toArray()
		)
	]);

	const totalsByAccount = new Map<string, { debitCents: number; creditCents: number }>();

	for (const entry of entries) {
		for (const line of entry.lines) {
			const accountId = line.accountId.toString();
			const current = totalsByAccount.get(accountId) ?? { debitCents: 0, creditCents: 0 };
			current.debitCents += line.debitCents;
			current.creditCents += line.creditCents;
			totalsByAccount.set(accountId, current);
		}
	}

	let totalDebitCents = 0;
	let totalCreditCents = 0;

	const rows = accounts
		.map((account) => {
			const totals = totalsByAccount.get(account.id) ?? { debitCents: 0, creditCents: 0 };
			totalDebitCents += totals.debitCents;
			totalCreditCents += totals.creditCents;

			return {
				accountId: account.id,
				accountCode: account.code,
				accountName: account.name,
				accountType: account.type,
				debitCents: totals.debitCents,
				creditCents: totals.creditCents,
				balanceCents: computeSignedBalanceCents({
					accountType: account.type as AccountType,
					debitCents: totals.debitCents,
					creditCents: totals.creditCents
				})
			};
		})
		.filter((row) => row.debitCents > 0 || row.creditCents > 0)
		.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

	return {
		periodId: period.id,
		periodLabel: period.label,
		rows,
		totalDebitCents,
		totalCreditCents
	};
}

export async function buildTrialBalanceForFiscalYear(input: {
	workspaceId: string;
	anchorYear: number;
	fiscalYearStartMonth: number;
}): Promise<TrialBalanceDto | null> {
	const periodIds = await listAccountingPeriodIdsForFiscalYear({
		workspaceId: input.workspaceId,
		anchorYear: input.anchorYear,
		fiscalYearStartMonth: input.fiscalYearStartMonth
	});

	if (periodIds.length === 0) {
		return null;
	}

	const [accounts, entries] = await Promise.all([
		listAccountingAccountsForWorkspace(input.workspaceId),
		getAccountingJournalEntriesCollection().then((collection) =>
			collection
				.find(
					{
						workspaceId: new ObjectId(input.workspaceId),
						periodId: { $in: periodIds.map((id) => new ObjectId(id)) }
					},
					{ projection: { lines: 1 } }
				)
				.toArray()
		)
	]);

	const totalsByAccount = new Map<string, { debitCents: number; creditCents: number }>();

	for (const entry of entries) {
		for (const line of entry.lines) {
			const accountId = line.accountId.toString();
			const current = totalsByAccount.get(accountId) ?? { debitCents: 0, creditCents: 0 };
			current.debitCents += line.debitCents;
			current.creditCents += line.creditCents;
			totalsByAccount.set(accountId, current);
		}
	}

	let totalDebitCents = 0;
	let totalCreditCents = 0;

	const rows = accounts
		.map((account) => {
			const totals = totalsByAccount.get(account.id) ?? { debitCents: 0, creditCents: 0 };
			totalDebitCents += totals.debitCents;
			totalCreditCents += totals.creditCents;

			return {
				accountId: account.id,
				accountCode: account.code,
				accountName: account.name,
				accountType: account.type,
				debitCents: totals.debitCents,
				creditCents: totals.creditCents,
				balanceCents: computeSignedBalanceCents({
					accountType: account.type as AccountType,
					debitCents: totals.debitCents,
					creditCents: totals.creditCents
				})
			};
		})
		.filter((row) => row.debitCents > 0 || row.creditCents > 0)
		.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

	return {
		periodId: `fy-${input.anchorYear}`,
		periodLabel: `FY ${input.anchorYear}`,
		rows,
		totalDebitCents,
		totalCreditCents
	};
}
