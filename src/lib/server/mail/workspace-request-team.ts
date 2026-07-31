import { sendMail } from '$lib/server/mail/index';
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
	const reviewUrl = `${input.origin}/admin/workspace-requests`;
	const content = {
		title: 'New workspace owner request',
		paragraphs: [
			`${input.requesterName} (${input.requesterEmail}) requested to create a workspace.`,
			`Workspace: ${input.workspaceName}`,
			`Slug: ${input.workspaceSlug}`,
			`Team size: ${input.teamSize}`,
			`Contact: ${input.contactPhone}`,
			`Country: ${input.country}`,
			'Review and approve or reject this request from the admin panel.'
		],
		logoUrl: `${input.origin}/email/urixoft-logo.png`,
		ctaLabel: 'Review request',
		ctaUrl: reviewUrl
	};

	await sendMail({
		to: input.to,
		subject: `Workspace request: ${input.workspaceName}`,
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
