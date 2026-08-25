import PDFDocument from 'pdfkit';
import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
import { formatPayRateCents } from '$lib/shared/payroll/format';
import { PAYROLL_PAY_TYPE_LABELS } from '$lib/shared/payroll/pay-rate';
import {
	formatPayslipGeneratedAt,
	formatPayslipMoney,
	formatPayslipPeriod,
	formatWorkedHours
} from '$lib/shared/payroll/payslip-format';
import { PAYSLIP_PRINT_MARGINS } from '$lib/shared/payroll/payslip-print';

function buildPayslipPdfFilename(payslip: PayrollPayslipDto): string {
	const safeTitle = payslip.runTitle.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-');
	return `payslip-${safeTitle}-${payslip.employeeFullName.replace(/\s+/g, '-')}.pdf`;
}

export function getPayslipPdfFilename(payslip: PayrollPayslipDto): string {
	return buildPayslipPdfFilename(payslip);
}

export function generatePayslipPdfBuffer(
	payslip: PayrollPayslipDto,
	currency: PayrollCurrency
): Promise<Buffer> {
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

		doc.fontSize(20).font('Helvetica-Bold').text('Payslip', { align: 'left' });
		doc.moveDown(0.5);
		doc.fontSize(12).font('Helvetica').text(payslip.runTitle);
		doc.text(formatPayslipPeriod(payslip));
		doc.moveDown(1);

		doc.font('Helvetica-Bold').text('Employee');
		doc.font('Helvetica').text(payslip.employeeFullName);

		if (payslip.employeeCode) {
			doc.text(`Code: ${payslip.employeeCode}`);
		}

		if (payslip.jobTitle) {
			doc.text(`Role: ${payslip.jobTitle}`);
		}

		doc.moveDown(0.75);
		doc.font('Helvetica-Bold').text('Pay rate');
		doc.font('Helvetica').text(
			`${formatPayRateCents(payslip.payRateCents, payslip.payType, currency)} (${PAYROLL_PAY_TYPE_LABELS[payslip.payType]})`
		);
		doc.text(`Actual Hours Logged: ${formatWorkedHours(payslip.workedMinutes)} (${payslip.workDays} day(s))`);

		doc.moveDown(1);
		doc.font('Helvetica-Bold').fontSize(14).text('Earnings');
		doc.moveDown(0.35);
		doc.fontSize(12).font('Helvetica');

		const line = (label: string, amountCents: number, emphasize = false) => {
			const y = doc.y;
			doc.font(emphasize ? 'Helvetica-Bold' : 'Helvetica').text(label, left, y, {
				width: 320,
				continued: false
			});
			doc.font(emphasize ? 'Helvetica-Bold' : 'Helvetica').text(formatPayslipMoney(amountCents, currency), {
				align: 'right'
			});
		};

		line('Base pay', payslip.basePayCents);

		if (payslip.holidayPayCents > 0) {
			line('Holiday pay', payslip.holidayPayCents);
		}

		line('Gross pay', payslip.grossCents, true);

		if (payslip.deductionLines.length > 0) {
			doc.moveDown(0.75);
			doc.font('Helvetica-Bold').fontSize(14).text('Deductions');
			doc.moveDown(0.35);
			doc.fontSize(12);

			for (const deduction of payslip.deductionLines) {
				line(deduction.name, -deduction.amountCents);
			}

			line('Total deductions', -payslip.totalDeductionsCents, true);
		}

		doc.moveDown(1);
		doc.font('Helvetica-Bold').fontSize(16).text('Net pay', left, doc.y, {
			width: 320,
			continued: false
		});
		doc.font('Helvetica-Bold').fontSize(16).text(formatPayslipMoney(payslip.netCents, currency), {
			align: 'right'
		});

		const right = doc.page.width - doc.page.margins.right;

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
			.text(`Date and time generated: ${formatPayslipGeneratedAt(new Date())}`, left, doc.y, {
				align: 'center',
				width: right - left
			});

		doc.end();
	});
}
