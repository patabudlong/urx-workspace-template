import { sendMail } from '$lib/server/mail/index';
import { resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
import { buildPlatformWorkspaceUrl } from '$lib/server/mail/platform-origin';
import {
	buildSimpleEmailHtml,
	buildSimpleEmailText
} from '$lib/server/mail/templates/simple-email';

export async function sendWorkspaceRequestTeamEmail(input: {
	to: string;
	requesterName: string;
	requesterEmail: string;
	workspaceName: string;
	workspaceSlug: string;
	teamSize: string;
	contactPhone: string;
	country: string;
	origin: string;
}): Promise<void> {
	const reviewUrl = buildPlatformWorkspaceUrl(input.origin, '/admin/workspace-requests');
	const content = {
		title: 'New workspace owner request',
		preheader: `${input.requesterName} requested workspace ${input.workspaceName}.`,
		paragraphs: [
			`${input.requesterName} (${input.requesterEmail}) requested to create a workspace.`,
			`Workspace: ${input.workspaceName}`,
			`Slug: ${input.workspaceSlug}`,
			`Team size: ${input.teamSize}`,
			`Contact: ${input.contactPhone}`,
			`Country: ${input.country}`
		],
		logoUrl: resolveEmailLogoUrl(input.origin),
		ctaLabel: 'Review request',
		ctaUrl: reviewUrl,
		infoBoxParagraphs: ['Review and approve or reject this request from the admin panel.']
	};

	await sendMail({
		to: input.to,
		subject: `Workspace request: ${input.workspaceName}`,
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
