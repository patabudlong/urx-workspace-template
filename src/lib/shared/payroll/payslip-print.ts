import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import {
	resolvePhDeductionIconUrlFromMap,
	type PhDeductionIconKey
} from '$lib/shared/payroll/deduction-icon-names';
import { formatPayRateCents } from '$lib/shared/payroll/format';
import { PAYROLL_PAY_TYPE_LABELS } from '$lib/shared/payroll/pay-rate';
import {
	formatPayslipGeneratedAt,
	formatPayslipMoney,
	formatPayslipPeriod,
	formatWorkedHours,
	getPayslipEmployeeNameParts
} from '$lib/shared/payroll/payslip-format';

/** 1 cm ≈ 28.35 pt (PDFKit). */
const CM_TO_PT = 72 / 2.54;

const topCm = 1;
const rightCm = 2;
const bottomCm = 2.5;
const leftCm = 2;

export const PAYSLIP_PRINT_MARGINS = {
	topCm,
	rightCm,
	bottomCm,
	leftCm,
	topPt: Math.round(topCm * CM_TO_PT),
	rightPt: Math.round(rightCm * CM_TO_PT),
	bottomPt: Math.round(bottomCm * CM_TO_PT),
	leftPt: Math.round(leftCm * CM_TO_PT)
} as const;

export const PAYSLIP_PRINT_DOCUMENT_CSS = `
	.pd-root {
		max-width: 720px;
		margin: 0 auto;
	}

	.pd-workspace {
		flex-shrink: 0;
		text-align: right;
	}

	.pd-workspace-name {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
	}

	.pd-header {
		align-items: flex-start;
		border-bottom: 1px solid #d4d4d8;
		display: flex;
		gap: 24px;
		justify-content: space-between;
		margin-bottom: 20px;
		padding-bottom: 16px;
	}

	.pd-header-main {
		min-width: 0;
	}

	.pd-title {
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0 0 4px;
	}

	.pd-subtitle,
	.pd-meta-label {
		color: #52525b;
		font-size: 13px;
		margin: 0;
	}

	.pd-meta {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-bottom: 24px;
	}

	.pd-meta-value {
		font-weight: 600;
		margin: 4px 0 0;
	}

	.pd-meta-hint {
		color: #71717a;
		font-size: 12px;
		margin: 2px 0 0;
	}

	.pd-net {
		font-size: 20px;
		font-weight: 700;
	}

	.pd-employee {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		margin-bottom: 24px;
	}

	.pd-employee-names {
		display: grid;
		gap: 16px;
		grid-column: 1 / -1;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.pd-section {
		margin-bottom: 24px;
	}

	.pd-section-title {
		font-size: 14px;
		font-weight: 600;
		margin: 0 0 8px;
	}

	.pd-table {
		border-collapse: collapse;
		width: 100%;
	}

	.pd-table td {
		border-bottom: 1px solid #e4e4e7;
		padding: 10px 0;
		vertical-align: middle;
	}

	.pd-table td:last-child {
		text-align: right;
		white-space: nowrap;
	}

	.pd-table tr:last-child td {
		border-bottom: none;
	}

	.pd-label {
		align-items: center;
		display: flex;
		gap: 10px;
	}

	.pd-label img {
		height: 24px;
		object-fit: contain;
		width: 24px;
	}

	.pd-strong {
		font-weight: 600;
	}

	.pd-total {
		font-weight: 700;
	}

	.pd-footer {
		border-top: 1px solid #e4e4e7;
		color: #71717a;
		font-size: 11px;
		margin-top: 32px;
		padding-top: 12px;
		text-align: center;
	}

	.pd-footer p {
		margin: 0;
	}
`;

export const PAYSLIP_PRINT_PAGE_CSS = `
	@page {
		margin: 0;
		size: A4;
	}

	* {
		box-sizing: border-box;
	}

	body {
		margin: 0;
		padding: ${PAYSLIP_PRINT_MARGINS.topCm}cm ${PAYSLIP_PRINT_MARGINS.rightCm}cm ${PAYSLIP_PRINT_MARGINS.bottomCm}cm ${PAYSLIP_PRINT_MARGINS.leftCm}cm;
		color: #111;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: 14px;
		line-height: 1.45;
	}

	${PAYSLIP_PRINT_DOCUMENT_CSS}
`;

export type PayslipPrintDocumentInput = {
	payslip: PayrollPayslipDto;
	currency: PayrollCurrency;
	workspaceName: string;
	showEmployee?: boolean;
	phDeductionIconUrls?: Partial<Record<PhDeductionIconKey, string>>;
};

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function renderDeductionLabel(
	name: string,
	iconUrls: Partial<Record<PhDeductionIconKey, string>>
): string {
	const iconUrl = resolvePhDeductionIconUrlFromMap(name, iconUrls);

	if (!iconUrl) {
		return `<span>${escapeHtml(name)}</span>`;
	}

	return `<span class="pd-label"><img src="${escapeHtml(iconUrl)}" alt="" /><span>${escapeHtml(name)}</span></span>`;
}

function renderWorkspaceHeader(workspaceName: string): string {
	return `
		<div class="pd-workspace">
			<p class="pd-workspace-name">${escapeHtml(workspaceName)}</p>
		</div>`;
}

export function buildPayslipPrintDocumentHtml(input: PayslipPrintDocumentInput): string {
	const {
		payslip,
		currency,
		workspaceName,
		showEmployee = false,
		phDeductionIconUrls = {}
	} = input;
	const showIcons = currency === 'PHP' && Object.keys(phDeductionIconUrls).length > 0;
	const totalDeductionsCents = payslip.deductionLines.reduce(
		(sum, line) => sum + line.amountCents,
		0
	);

	const employeeSection =
		showEmployee
			? (() => {
					const names = getPayslipEmployeeNameParts(payslip);

					return `
		<section class="pd-employee">
			<div class="pd-employee-names">
				<div>
					<p class="pd-meta-label">First name</p>
					<p class="pd-meta-value">${escapeHtml(names.firstName)}</p>
				</div>
				<div>
					<p class="pd-meta-label">Middle name</p>
					<p class="pd-meta-value">${names.middleName ? escapeHtml(names.middleName) : '—'}</p>
				</div>
				<div>
					<p class="pd-meta-label">Last name</p>
					<p class="pd-meta-value">${escapeHtml(names.lastName)}</p>
				</div>
			</div>
			${
				payslip.employeeCode
					? `
			<div>
				<p class="pd-meta-label">Employee code</p>
				<p class="pd-meta-value">${escapeHtml(payslip.employeeCode)}</p>
			</div>`
					: ''
			}
			${
				payslip.jobTitle
					? `
			<div>
				<p class="pd-meta-label">Job title</p>
				<p class="pd-meta-value">${escapeHtml(payslip.jobTitle)}</p>
			</div>`
					: ''
			}
		</section>`;
				})()
			: '';

	const holidayRow =
		payslip.holidayPayCents > 0
			? `
			<tr>
				<td>Holiday pay</td>
				<td class="pd-strong">${escapeHtml(formatPayslipMoney(payslip.holidayPayCents, currency))}</td>
			</tr>`
			: '';

	const deductionRows = payslip.deductionLines
		.map(
			(line) => `
			<tr>
				<td>${showIcons ? renderDeductionLabel(line.name, phDeductionIconUrls) : escapeHtml(line.name)}</td>
				<td class="pd-strong">−${escapeHtml(formatPayslipMoney(line.amountCents, currency))}</td>
			</tr>`
		)
		.join('');

	const deductionsSection =
		payslip.deductionLines.length > 0
			? `
		<section class="pd-section">
			<h3 class="pd-section-title">Deductions</h3>
			<table class="pd-table">
				<tbody>
					${deductionRows}
					<tr>
						<td class="pd-total">Total deductions</td>
						<td class="pd-total">−${escapeHtml(formatPayslipMoney(totalDeductionsCents, currency))}</td>
					</tr>
				</tbody>
			</table>
		</section>`
			: '';

	const body = `
		<article class="pd-root">
			<header class="pd-header">
				<div class="pd-header-main">
					<h1 class="pd-title">${escapeHtml(payslip.runTitle)}</h1>
					<p class="pd-subtitle">${escapeHtml(formatPayslipPeriod(payslip))}</p>
					<p class="pd-subtitle">${escapeHtml(payslip.payType)} pay</p>
				</div>
				${renderWorkspaceHeader(workspaceName)}
			</header>

			${employeeSection}

			<section class="pd-meta">
				<div>
					<p class="pd-meta-label">Pay rate</p>
					<p class="pd-meta-value">${escapeHtml(formatPayRateCents(payslip.payRateCents, payslip.payType, currency))}</p>
					<p class="pd-meta-hint">${escapeHtml(PAYROLL_PAY_TYPE_LABELS[payslip.payType])}</p>
				</div>
				<div>
					<p class="pd-meta-label">Actual Hours Logged</p>
					<p class="pd-meta-value">${escapeHtml(formatWorkedHours(payslip.workedMinutes))}</p>
					<p class="pd-meta-hint">${payslip.workDays} day(s) with time</p>
				</div>
				<div>
					<p class="pd-meta-label">Net pay</p>
					<p class="pd-net">${escapeHtml(formatPayslipMoney(payslip.netCents, currency))}</p>
				</div>
			</section>

			<section class="pd-section">
				<h3 class="pd-section-title">Earnings</h3>
				<table class="pd-table">
					<tbody>
						<tr>
							<td>Base pay</td>
							<td class="pd-strong">${escapeHtml(formatPayslipMoney(payslip.basePayCents, currency))}</td>
						</tr>
						${holidayRow}
						<tr>
							<td class="pd-total">Gross pay</td>
							<td class="pd-total">${escapeHtml(formatPayslipMoney(payslip.grossCents, currency))}</td>
						</tr>
					</tbody>
				</table>
			</section>

			${deductionsSection}

			<footer class="pd-footer">
				<p>Date and time generated: ${escapeHtml(formatPayslipGeneratedAt(new Date()))}</p>
			</footer>
		</article>
	`;

	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Payslip — ${escapeHtml(payslip.employeeFullName)}</title>
		<style>${PAYSLIP_PRINT_PAGE_CSS}</style>
	</head>
	<body>
		${body}
	</body>
</html>`;
}
