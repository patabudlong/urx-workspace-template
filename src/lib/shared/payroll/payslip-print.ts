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
	formatPayslipPeriod
} from '$lib/shared/payroll/payslip-format';
import {
	buildPayslipDeductionLines,
	buildPayslipDisplayContext,
	buildPayslipEarningLines,
	buildPayslipEmployeeFields,
	buildPayslipTotalLines,
	formatPayslipDeductionLabel,
	formatPayslipEarningLineAmount,
	formatPayslipEarningLineLabel,
	isPayslipEarningInfoLine,
	PAYSLIP_CONFIDENTIALITY_NOTICE,
	PAYSLIP_DOCUMENT_TITLE,
	PAYSLIP_SECTION_LABELS
} from '$lib/shared/payroll/payslip-sections';

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

	.pd-workspace-meta {
		color: #52525b;
		font-size: 12px;
		margin: 4px 0 0;
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
		grid-template-columns: repeat(2, minmax(0, 1fr));
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

	.pd-employee {
		display: grid;
		gap: 16px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		margin-bottom: 24px;
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

	.pd-net {
		font-size: 20px;
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
		margin: 0 0 4px;
	}

	.pd-footer p:last-child {
		margin-bottom: 0;
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
	registeredCompanyName?: string | null;
	showYtdTotals?: boolean;
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
	const label = formatPayslipDeductionLabel(name);

	if (!iconUrl) {
		return `<span>${escapeHtml(label)}</span>`;
	}

	return `<span class="pd-label"><img src="${escapeHtml(iconUrl)}" alt="" /><span>${escapeHtml(label)}</span></span>`;
}

function renderWorkspaceHeader(
	companyName: string,
	referenceNumber: string,
	periodLabel: string
): string {
	return `
		<div class="pd-workspace">
			<p class="pd-workspace-name">${escapeHtml(companyName)}</p>
			<p class="pd-workspace-meta">Reference: ${escapeHtml(referenceNumber)}</p>
			<p class="pd-workspace-meta">${escapeHtml(periodLabel)}</p>
		</div>`;
}

export function buildPayslipPrintDocumentHtml(input: PayslipPrintDocumentInput): string {
	const {
		payslip,
		currency,
		workspaceName,
		registeredCompanyName = null,
		showYtdTotals = false,
		showEmployee = false,
		phDeductionIconUrls = {}
	} = input;
	const display = buildPayslipDisplayContext({
		payslip,
		workspaceName,
		registeredCompanyName,
		showYtdTotals
	});
	const showIcons = currency === 'PHP' && Object.keys(phDeductionIconUrls).length > 0;
	const periodLabel = formatPayslipPeriod(payslip);
	const earningLines = buildPayslipEarningLines(payslip, currency);
	const deductionLines = buildPayslipDeductionLines(payslip.deductionLines);
	const totalLines = buildPayslipTotalLines(payslip, display.showYtdTotals);

	const employeeSection =
		showEmployee
			? `
		<section class="pd-section">
			<h3 class="pd-section-title">${escapeHtml(PAYSLIP_SECTION_LABELS.employeeInformation)}</h3>
			<div class="pd-employee">
				${buildPayslipEmployeeFields(payslip)
					.map(
						(field) => `
				<div>
					<p class="pd-meta-label">${escapeHtml(field.label)}</p>
					<p class="pd-meta-value">${escapeHtml(field.value)}</p>
				</div>`
					)
					.join('')}
			</div>
		</section>`
			: '';

	const earningsRows = earningLines
		.map((line) => {
			if (isPayslipEarningInfoLine(line)) {
				return `
			<tr>
				<td>${escapeHtml(formatPayslipEarningLineLabel(line))}</td>
				<td class="pd-strong">${escapeHtml(formatPayslipEarningLineAmount(line, currency))}</td>
			</tr>`;
			}

			const emphasize = line.emphasize ? ' pd-total' : ' pd-strong';
			return `
			<tr>
				<td${line.emphasize ? ' class="pd-total"' : ''}>${escapeHtml(formatPayslipEarningLineLabel(line))}</td>
				<td class="${emphasize.trim()}">${escapeHtml(formatPayslipMoney(line.amountCents, currency))}</td>
			</tr>`;
		})
		.join('');

	const deductionRows = deductionLines
		.map(
			(line) => `
			<tr>
				<td>${showIcons ? renderDeductionLabel(line.label, phDeductionIconUrls) : escapeHtml(line.label)}</td>
				<td class="pd-strong">−${escapeHtml(formatPayslipMoney(line.amountCents, currency))}</td>
			</tr>`
		)
		.join('');

	const deductionsSection =
		deductionLines.length > 0
			? `
		<section class="pd-section">
			<h3 class="pd-section-title">${escapeHtml(PAYSLIP_SECTION_LABELS.deductions)}</h3>
			<table class="pd-table">
				<tbody>
					${deductionRows}
				</tbody>
			</table>
		</section>`
			: '';

	const totalsRows = totalLines
		.map((line) => {
			const emphasize = line.emphasize ? ' pd-total' : ' pd-strong';
			const prefix = line.key === 'total-deductions' ? '−' : '';

			return `
			<tr>
				<td${line.emphasize ? ' class="pd-total"' : ''}>${escapeHtml(line.label)}</td>
				<td class="${emphasize.trim()}">${prefix}${escapeHtml(formatPayslipMoney(line.amountCents, currency))}</td>
			</tr>`;
		})
		.join('');

	const body = `
		<article class="pd-root">
			<header class="pd-header">
				<div class="pd-header-main">
					<h1 class="pd-title">${escapeHtml(PAYSLIP_DOCUMENT_TITLE)}</h1>
					<p class="pd-subtitle">${escapeHtml(payslip.runTitle)}</p>
					<p class="pd-subtitle">${escapeHtml(payslip.payType)} pay · ${escapeHtml(formatPayRateCents(payslip.payRateCents, payslip.payType, currency))} (${escapeHtml(PAYROLL_PAY_TYPE_LABELS[payslip.payType])})</p>
				</div>
				${renderWorkspaceHeader(display.companyName, display.referenceNumber, periodLabel)}
			</header>

			${employeeSection}

			<section class="pd-section">
				<h3 class="pd-section-title">${escapeHtml(PAYSLIP_SECTION_LABELS.earnings)}</h3>
				<table class="pd-table">
					<tbody>
						${earningsRows}
					</tbody>
				</table>
			</section>

			${deductionsSection}

			<section class="pd-section">
				<h3 class="pd-section-title">${escapeHtml(PAYSLIP_SECTION_LABELS.totals)}</h3>
				<table class="pd-table">
					<tbody>
						${totalsRows}
					</tbody>
				</table>
			</section>

			<footer class="pd-footer">
				<p>${escapeHtml(PAYSLIP_CONFIDENTIALITY_NOTICE)}</p>
				<p>Validation reference: ${escapeHtml(display.validationReference)}</p>
				<p>Date and time generated: ${escapeHtml(formatPayslipGeneratedAt(new Date()))}</p>
			</footer>
		</article>
	`;

	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${escapeHtml(PAYSLIP_DOCUMENT_TITLE)} — ${escapeHtml(payslip.employeeFullName)}</title>
		<style>${PAYSLIP_PRINT_PAGE_CSS}</style>
	</head>
	<body>
		${body}
	</body>
</html>`;
}
