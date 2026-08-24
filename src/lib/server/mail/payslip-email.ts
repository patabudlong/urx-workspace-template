import { isMailConfigured, sendMail } from '$lib/server/mail/index';
import { resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
import {
	buildSimpleEmailHtml,
	buildSimpleEmailText
} from '$lib/server/mail/templates/simple-email';
import {
	generatePayslipPdfBuffer,
	getPayslipPdfFilename
} from '$lib/server/payroll/payslip-pdf';
import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
import { normalizeLegacyBrandText } from '$lib/shared/brand-normalize';
import { APP_NAME } from '$lib/shared/site-meta';
import { formatPayslipMoney, formatPayslipPeriod } from '$lib/shared/payroll/payslip-format';

export async function sendPayslipEmail(input: {
	to: string;
	workspaceName: string;
	payslip: PayrollPayslipDto;
	currency: PayrollCurrency;
	payslipUrl: string;
	origin: string;
}): Promise<void> {
	if (!isMailConfigured()) {
		throw new Error('Mail is not configured');
	}

	const pdfBuffer = await generatePayslipPdfBuffer(input.payslip, input.currency);
	const filename = getPayslipPdfFilename(input.payslip);
	const workspaceName = normalizeLegacyBrandText(input.workspaceName);
	const runTitle = normalizeLegacyBrandText(input.payslip.runTitle);

	const content = {
		title: 'Your payslip is ready',
		greeting: input.payslip.employeeFirstName,
		logoUrl: resolveEmailLogoUrl(input.origin),
		preheader: `Your payslip for ${runTitle} is attached.`,
		paragraphs: [
			`Your payslip for ${runTitle} (${formatPayslipPeriod(input.payslip)}) is attached as a PDF.`,
			`Net pay: ${formatPayslipMoney(input.payslip.netCents, input.currency)}.`,
			`You can also sign in to ${workspaceName} on ${APP_NAME} to view payslips online.`
		],
		ctaLabel: 'View payslip online',
		ctaUrl: input.payslipUrl,
		footerNoteParagraphs: [
			`Sent by ${APP_NAME}. If you did not expect this payslip, contact your workspace administrator.`
		]
	};

	await sendMail({
		to: input.to,
		subject: `${workspaceName} payslip — ${runTitle}`,
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content),
		attachments: [
			{
				filename,
				content: pdfBuffer,
				contentType: 'application/pdf'
			}
		]
	});
}
