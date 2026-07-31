import { sendMail } from '$lib/server/mail/index';
import {
	buildSimpleEmailHtml,
	buildSimpleEmailText
} from '$lib/server/mail/templates/simple-email';

export async function sendWorkspaceRequestReceivedEmail(input: {
	to: string;
	firstName: string;
	workspaceName: string;
	origin: string;
}): Promise<void> {
	const greeting = input.firstName.trim() || 'there';
	const content = {
		title: 'We received your workspace request',
		greeting,
		logoUrl: `${input.origin}/email/urixoft-logo.png`,
		paragraphs: [
			`Thanks for requesting a workspace for ${input.workspaceName}.`,
			'Our team will review your company details and verify your workspace request. You will receive access to the dashboard once your workspace is approved.',
			'If you have questions in the meantime, reply to this email or contact our support team.'
		]
	};

	await sendMail({
		to: input.to,
		subject: 'Your workspace request is under review',
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
