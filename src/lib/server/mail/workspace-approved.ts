import { sendMail } from '$lib/server/mail/index';
import { EMAIL_ASSETS, resolveEmailAssetUrl, resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
import {
	buildPlatformWorkspaceUrl,
	formatPlatformWorkspaceHost
} from '$lib/server/mail/platform-origin';
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
	const platformHost = formatPlatformWorkspaceHost(input.origin);
	const dashboardUrl = buildPlatformWorkspaceUrl(input.origin, '/login');
	const content = {
		title: 'Your workspace is approved',
		greeting,
		logoUrl: resolveEmailLogoUrl(input.origin),
		illustrationUrl: resolveEmailAssetUrl(EMAIL_ASSETS.workspaceApproved, input.origin),
		illustrationAlt: 'Workspace approved welcome illustration',
		preheader: `${input.workspaceName} is ready. Sign in to open your dashboard.`,
		paragraphs: [
			`Great news — your workspace ${input.workspaceName} has been approved.`,
			`Sign in at ${platformHost} to set up your team and start using Urixoft Workspace.`
		],
		ctaLabel: 'Sign in',
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
