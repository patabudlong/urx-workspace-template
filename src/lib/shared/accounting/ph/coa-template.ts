import type { AccountType } from '$lib/shared/accounting/core/account-types';

export type PhCoaTemplateAccount = {
	code: string;
	name: string;
	type: AccountType;
	description?: string;
};

export const PH_SME_COA_TEMPLATE: PhCoaTemplateAccount[] = [
	{ code: '1010', name: 'Cash on Hand', type: 'asset' },
	{ code: '1020', name: 'Cash in Bank', type: 'asset' },
	{ code: '1100', name: 'Accounts Receivable', type: 'asset' },
	{ code: '1300', name: 'Prepaid Expenses', type: 'asset' },
	{ code: '2010', name: 'Accounts Payable', type: 'liability' },
	{ code: '2110', name: 'VAT Payable', type: 'liability' },
	{ code: '2120', name: 'Withholding Tax Payable', type: 'liability' },
	{ code: '2210', name: 'SSS Payable', type: 'liability' },
	{ code: '2220', name: 'PhilHealth Payable', type: 'liability' },
	{ code: '2230', name: 'Pag-IBIG Payable', type: 'liability' },
	{ code: '3010', name: "Owner's Capital", type: 'equity' },
	{ code: '3020', name: 'Retained Earnings', type: 'equity' },
	{ code: '4010', name: 'Service Revenue', type: 'revenue' },
	{ code: '4020', name: 'Sales Revenue', type: 'revenue' },
	{ code: '5010', name: 'Salaries and Wages', type: 'expense' },
	{ code: '5020', name: 'Rent Expense', type: 'expense' },
	{ code: '5030', name: 'Utilities Expense', type: 'expense' },
	{ code: '5040', name: 'Office Supplies', type: 'expense' }
];
