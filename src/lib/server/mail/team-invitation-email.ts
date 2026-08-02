import { sendMail } from '$lib/server/mail/index';
import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import {
	buildSimpleEmailHtml,
	buildSimpleEmailText
} from '$lib/server/mail/templates/simple-email';
import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';

export async function sendTeamInvitationEmail(input: {
	to: string;
	inviterName: string;
	workspaceName: string;
	role: string;
	acceptUrl: string;
	origin: string;
}): Promise<void> {
	const platformOrigin = resolvePlatformWorkspaceOrigin(input.origin);
	const roleLabel = findTeamInviteRoleOption(input.role)?.label ?? input.role;
	const content = {
		title: `You're invited to ${input.workspaceName}`,
		greeting: 'there',
		logoUrl: `${platformOrigin}/email/urixoft-logo.png`,
		illustrationUrl: `${platformOrigin}/email/team-invitation.png`,
		illustrationAlt: 'Workspace invitation illustration',
		preheader: `${input.inviterName} invited you to join ${input.workspaceName} on Urixoft Workspace.`,
		paragraphs: [
			`${input.inviterName} invited you to join ${input.workspaceName} as ${roleLabel}.`,
			'Accept the invitation to collaborate with your team in Urixoft Workspace.'
		],
		ctaLabel: 'Accept invitation',
		ctaUrl: input.acceptUrl,
		infoBoxParagraphs: [
			'If you were not expecting this invitation, you can safely ignore this email.'
		]
	};

	await sendMail({
		to: input.to,
		subject: `You're invited to join ${input.workspaceName}`,
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
