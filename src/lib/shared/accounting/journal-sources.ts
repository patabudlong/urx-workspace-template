export const ACCOUNTING_JOURNAL_SOURCES = [
	'manual',
	'opening_balance',
	'payroll',
	'fiscal_year_close'
] as const;

export type AccountingJournalSource = (typeof ACCOUNTING_JOURNAL_SOURCES)[number];

export const USER_CREATABLE_JOURNAL_SOURCES = ['manual', 'opening_balance'] as const;

export type UserCreatableJournalSource = (typeof USER_CREATABLE_JOURNAL_SOURCES)[number];

export const ACCOUNTING_JOURNAL_SOURCE_LABELS: Record<AccountingJournalSource, string> = {
	manual: 'Manual',
	opening_balance: 'Opening balance',
	payroll: 'Payroll',
	fiscal_year_close: 'Fiscal year close'
};
