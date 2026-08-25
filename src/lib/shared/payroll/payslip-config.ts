/** Document title shown on every payslip view, print layout, and PDF. */
export const PAYSLIP_DOCUMENT_TITLE = 'Employee Payslip';

/** Footer confidentiality notice for digital and printed payslips. */
export const PAYSLIP_CONFIDENTIALITY_NOTICE = 'This document is confidential.';

/** Prefix for human-readable payslip reference numbers. */
export const PAYSLIP_REFERENCE_PREFIX = 'PS';

/** Prefix for system validation references on generated PDFs. */
export const PAYSLIP_VALIDATION_PREFIX = 'VR';

export const PAYSLIP_SECTION_LABELS = {
	employeeInformation: 'Employee information',
	earnings: 'Earnings',
	deductions: 'Deductions',
	totals: 'Totals'
} as const;

export const PAYSLIP_EMPLOYEE_FIELD_LABELS = {
	fullName: 'Full name',
	employeeNumber: 'Employee number',
	positionOrDepartment: 'Position or department',
	tin: 'TIN'
} as const;

export const PAYSLIP_EARNING_LABELS = {
	basicPay: 'Basic salary or daily rate',
	daysOrHoursPaid: 'Days or hours paid',
	overtime: 'Overtime',
	holidayOrRestDayPay: 'Holiday or rest-day pay',
	nightShiftDifferential: 'Night-shift differential',
	otherCompensation: 'Allowances, commissions, bonuses, or other compensation',
	grossPay: 'Gross pay'
} as const;

export const PAYSLIP_DEDUCTION_LABELS = {
	sss: 'SSS',
	philHealth: 'PhilHealth',
	pagIbig: 'Pag-IBIG',
	withholdingTax: 'BIR withholding tax',
	otherDeductions: 'Authorized loans, advances, or other deductions',
	totalDeductions: 'Total deductions'
} as const;

export const PAYSLIP_TOTAL_LABELS = {
	grossPay: 'Gross pay',
	totalDeductions: 'Total deductions',
	netPay: 'Net pay',
	ytdGrossPay: 'Year-to-date gross pay',
	ytdNetPay: 'Year-to-date net pay'
} as const;
