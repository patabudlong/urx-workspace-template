export const PAYROLL_JOURNAL_ACCOUNT_CODES = {
	salaries: '5010',
	cashInBank: '1020',
	accountsPayable: '2010',
	retainedEarnings: '3020'
} as const;

const DEDUCTION_ACCOUNT_CODE_BY_KEYWORD: Array<{ keywords: string[]; code: string }> = [
	{ keywords: ['sss'], code: '2210' },
	{ keywords: ['philhealth'], code: '2220' },
	{ keywords: ['pagibig', 'pag-ibig'], code: '2230' },
	{ keywords: ['withholding', 'bir'], code: '2120' }
];

export function normalizeDeductionName(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolvePayrollDeductionAccountCode(deductionName: string): string {
	const normalized = normalizeDeductionName(deductionName);

	for (const mapping of DEDUCTION_ACCOUNT_CODE_BY_KEYWORD) {
		if (mapping.keywords.some((keyword) => normalized.includes(normalizeDeductionName(keyword)))) {
			return mapping.code;
		}
	}

	return PAYROLL_JOURNAL_ACCOUNT_CODES.accountsPayable;
}
