import { isMailConfigured, sendMail } from '$lib/server/mail/index';
import { EMAIL_ASSETS, resolveEmailAssetUrl, resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
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

	const content = {
		title: 'Your payslip is ready',
		greeting: input.payslip.employeeFirstName,
		logoUrl: resolveEmailLogoUrl(input.origin),
		illustrationUrl: resolveEmailAssetUrl(EMAIL_ASSETS.messages, input.origin),
		illustrationAlt: 'Payslip notification',
		illustrationWidth: 400,
		preheader: `Your payslip for ${input.payslip.runTitle} is attached.`,
		paragraphs: [
			`Your payslip for ${input.payslip.runTitle} (${formatPayslipPeriod(input.payslip)}) is attached as a PDF.`,
			`Net pay: ${formatPayslipMoney(input.payslip.netCents, input.currency)}.`,
			`You can also sign in to ${input.workspaceName} to view payslips online.`
		],
		ctaLabel: 'View payslip online',
		ctaUrl: input.payslipUrl,
		footerNoteParagraphs: [
			'If you did not expect this payslip, contact your workspace administrator.'
		]
	};

	await sendMail({
		to: input.to,
		subject: `${input.workspaceName} payslip — ${input.payslip.runTitle}`,
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
