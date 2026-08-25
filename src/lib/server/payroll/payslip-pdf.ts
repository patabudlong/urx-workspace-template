import PDFDocument from 'pdfkit';
import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
import { formatPayRateCents } from '$lib/shared/payroll/format';
import { PAYROLL_PAY_TYPE_LABELS } from '$lib/shared/payroll/pay-rate';
import { formatPayslipGeneratedAt, formatPayslipMoney, formatPayslipPeriod } from '$lib/shared/payroll/payslip-format';
import { PAYSLIP_PRINT_MARGINS } from '$lib/shared/payroll/payslip-print';
import {
	buildPayslipDeductionLines,
	buildPayslipDisplayContext,
	buildPayslipEarningLines,
	buildPayslipEmployeeFields,
	buildPayslipTotalLines,
	formatPayslipEarningLineAmount,
	formatPayslipEarningLineLabel,
	isPayslipEarningInfoLine,
	PAYSLIP_CONFIDENTIALITY_NOTICE,
	PAYSLIP_DOCUMENT_TITLE,
	PAYSLIP_SECTION_LABELS
} from '$lib/shared/payroll/payslip-sections';

export type PayslipPdfInput = {
	payslip: PayrollPayslipDto;
	currency: PayrollCurrency;
	workspaceName: string;
	registeredCompanyName?: string | null;
	showYtdTotals?: boolean;
};

function buildPayslipPdfFilename(payslip: PayrollPayslipDto): string {
	const safeTitle = payslip.runTitle.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-');
	return `payslip-${safeTitle}-${payslip.employeeFullName.replace(/\s+/g, '-')}.pdf`;
}

export function getPayslipPdfFilename(payslip: PayrollPayslipDto): string {
	return buildPayslipPdfFilename(payslip);
}

export function generatePayslipPdfBuffer(input: PayslipPdfInput): Promise<Buffer> {
	const { payslip, currency, workspaceName, registeredCompanyName = null, showYtdTotals = false } =
		input;

	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({
			size: 'A4',
			margins: {
				top: PAYSLIP_PRINT_MARGINS.topPt,
				right: PAYSLIP_PRINT_MARGINS.rightPt,
				bottom: PAYSLIP_PRINT_MARGINS.bottomPt,
				left: PAYSLIP_PRINT_MARGINS.leftPt
			}
		});
		const chunks: Buffer[] = [];

		doc.on('data', (chunk: Buffer) => chunks.push(chunk));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		const left = doc.page.margins.left;
		const right = doc.page.width - doc.page.margins.right;
		const display = buildPayslipDisplayContext({
			payslip,
			workspaceName,
			registeredCompanyName,
			showYtdTotals
		});

		doc.fontSize(20).font('Helvetica-Bold').text(PAYSLIP_DOCUMENT_TITLE, { align: 'left' });
		doc.moveDown(0.35);
		doc.fontSize(12).font('Helvetica').text(payslip.runTitle);
		doc.text(formatPayslipPeriod(payslip));
		doc.text(
			`${formatPayRateCents(payslip.payRateCents, payslip.payType, currency)} (${PAYROLL_PAY_TYPE_LABELS[payslip.payType]})`
		);
		doc.text(`Reference: ${display.referenceNumber}`);
		doc.text(display.companyName, { align: 'right' });
		doc.moveDown(0.75);

		doc.font('Helvetica-Bold').text(PAYSLIP_SECTION_LABELS.employeeInformation);
		doc.moveDown(0.25);
		doc.font('Helvetica');

		for (const field of buildPayslipEmployeeFields(payslip)) {
			doc.text(`${field.label}: ${field.value}`);
		}

		const line = (label: string, amountText: string, emphasize = false) => {
			const y = doc.y;
			doc.font(emphasize ? 'Helvetica-Bold' : 'Helvetica').text(label, left, y, {
				width: 320,
				continued: false
			});
			doc.font(emphasize ? 'Helvetica-Bold' : 'Helvetica').text(amountText, {
				align: 'right'
			});
		};

		doc.moveDown(0.75);
		doc.font('Helvetica-Bold').fontSize(14).text(PAYSLIP_SECTION_LABELS.earnings);
		doc.moveDown(0.35);
		doc.fontSize(12).font('Helvetica');

		for (const earningLine of buildPayslipEarningLines(payslip, currency)) {
			if (isPayslipEarningInfoLine(earningLine)) {
				line(
					formatPayslipEarningLineLabel(earningLine),
					formatPayslipEarningLineAmount(earningLine, currency)
				);
				continue;
			}

			line(
				formatPayslipEarningLineLabel(earningLine),
				formatPayslipMoney(earningLine.amountCents, currency),
				earningLine.emphasize
			);
		}

		const deductionLines = buildPayslipDeductionLines(payslip.deductionLines);

		if (deductionLines.length > 0) {
			doc.moveDown(0.75);
			doc.font('Helvetica-Bold').fontSize(14).text(PAYSLIP_SECTION_LABELS.deductions);
			doc.moveDown(0.35);
			doc.fontSize(12);

			for (const deduction of deductionLines) {
				line(deduction.label, `−${formatPayslipMoney(deduction.amountCents, currency)}`);
			}
		}

		doc.moveDown(0.75);
		doc.font('Helvetica-Bold').fontSize(14).text(PAYSLIP_SECTION_LABELS.totals);
		doc.moveDown(0.35);
		doc.fontSize(12);

		for (const totalLine of buildPayslipTotalLines(payslip, display.showYtdTotals)) {
			const prefix = totalLine.key === 'total-deductions' ? '−' : '';
			line(
				totalLine.label,
				`${prefix}${formatPayslipMoney(totalLine.amountCents, currency)}`,
				totalLine.emphasize
			);
		}

		doc.moveDown(2);
		doc.strokeColor('#e4e4e7')
			.lineWidth(0.5)
			.moveTo(left, doc.y)
			.lineTo(right, doc.y)
			.stroke();
		doc.moveDown(0.5);
		doc.font('Helvetica')
			.fontSize(9)
			.fillColor('#71717a')
			.text(PAYSLIP_CONFIDENTIALITY_NOTICE, left, doc.y, {
				align: 'center',
				width: right - left
			});
		doc.moveDown(0.25);
		doc.text(`Validation reference: ${display.validationReference}`, left, doc.y, {
			align: 'center',
			width: right - left
		});
		doc.moveDown(0.25);
		doc.text(`Date and time generated: ${formatPayslipGeneratedAt(new Date())}`, left, doc.y, {
			align: 'center',
			width: right - left
		});

		doc.end();
	});
}
