import { sendMail } from '$lib/server/mail/index';
import {
	buildSimpleEmailHtml,
	buildSimpleEmailText
} from '$lib/server/mail/templates/simple-email';

export async function sendWorkspaceApprovedEmail(input: {
	to: string;
	firstName: string;
	workspaceName: string;
	workspaceSlug: string;
	origin: string;
}): Promise<void> {
	const greeting = input.firstName.trim() || 'there';
	const dashboardUrl = `${input.origin.replace(/\/$/, '')}/`;
	const content = {
		title: 'Your workspace is approved',
		greeting,
		logoUrl: `${input.origin}/email/urixoft-logo.png`,
		illustrationUrl: `${input.origin}/email/workspace-approved.png`,
		illustrationAlt: 'Welcome illustration',
		preheader: `${input.workspaceName} is ready. Sign in to open your dashboard.`,
		paragraphs: [
			`Great news — your workspace ${input.workspaceName} has been approved.`,
			`Your workspace URL is ${input.workspaceSlug}.workspace.urixoft.com. Sign in to set up your team and start using Urixoft Workspace.`
		],
		ctaLabel: 'Open dashboard',
		ctaUrl: dashboardUrl,
		infoBoxParagraphs: [
			'If you have any questions getting started, reply to this email or contact our support team.'
		]
	};

	await sendMail({
		to: input.to,
		subject: `Your workspace ${input.workspaceName} is approved`,
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
