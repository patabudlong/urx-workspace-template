export const ACCOUNTING_JOURNAL_SOURCES = ['manual', 'opening_balance'] as const;

export type AccountingJournalSource = (typeof ACCOUNTING_JOURNAL_SOURCES)[number];

export const ACCOUNTING_JOURNAL_SOURCE_LABELS: Record<AccountingJournalSource, string> = {
	manual: 'Manual',
	opening_balance: 'Opening balance'
};
