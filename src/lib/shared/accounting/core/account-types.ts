export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
	asset: 'Asset',
	liability: 'Liability',
	equity: 'Equity',
	revenue: 'Revenue',
	expense: 'Expense'
};

export const NORMAL_DEBIT_TYPES = new Set<AccountType>(['asset', 'expense']);

export function isDebitNormalAccount(type: AccountType): boolean {
	return NORMAL_DEBIT_TYPES.has(type);
}

export function computeSignedBalanceCents(input: {
	accountType: AccountType;
	debitCents: number;
	creditCents: number;
}): number {
	const net = input.debitCents - input.creditCents;
	return isDebitNormalAccount(input.accountType) ? net : -net;
}
