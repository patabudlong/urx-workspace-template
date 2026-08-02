import { sendMail } from '$lib/server/mail/index';
import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import {
	buildSimpleEmailHtml,
	buildSimpleEmailText
} from '$lib/server/mail/templates/simple-email';
import { INVITATION_TTL_DAYS } from '$lib/shared/team/invitation-ttl';
import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';

function formatInvitationExpiry(expiresAt: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'long',
		timeStyle: 'short'
	}).format(expiresAt);
}

export async function sendTeamInvitationEmail(input: {
	to: string;
	inviterName: string;
	workspaceName: string;
	role: string;
	acceptUrl: string;
	origin: string;
	expiresAt: Date;
}): Promise<void> {
	const platformOrigin = resolvePlatformWorkspaceOrigin(input.origin);
	const roleLabel = findTeamInviteRoleOption(input.role)?.label ?? input.role;
	const expiryLabel = formatInvitationExpiry(input.expiresAt);
	const content = {
		title: `You're invited to ${input.workspaceName}`,
		greeting: 'there',
		logoUrl: `${platformOrigin}/email/urixoft-logo.png`,
		illustrationUrl: `${platformOrigin}/email/team-invitation.png`,
		illustrationAlt: 'Workspace invitation illustration',
		illustrationWidth: 400,
		preheader: `${input.inviterName} invited you to join ${input.workspaceName} on Urixoft Workspace.`,
		paragraphs: [
			`${input.inviterName} added you to ${input.workspaceName} as ${roleLabel}.`,
			`This invite expires on ${expiryLabel} (${INVITATION_TTL_DAYS} days from when it was sent).`,
			'Click below to accept and join your team in Urixoft Workspace.'
		],
		ctaLabel: 'Accept invitation',
		ctaUrl: input.acceptUrl,
		infoBoxParagraphs: [
			'If you already have an account, sign in with the email address that received this invitation.',
			"If you're new, create an account with that same email to join."
		],
		footerNoteParagraphs: [
			'If you did not expect this invitation, you can safely ignore this email.'
		]
	};

	await sendMail({
		to: input.to,
		subject: `${input.inviterName} invited you to ${input.workspaceName}`,
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
