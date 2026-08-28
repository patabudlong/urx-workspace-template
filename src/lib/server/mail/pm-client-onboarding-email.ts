import { sendMail } from '$lib/server/mail/index';
import { EMAIL_ASSETS, resolveEmailAssetUrl, resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
import {
	buildSimpleEmailHtml,
	buildSimpleEmailText
} from '$lib/server/mail/templates/simple-email';
import { PM_CLIENT_ONBOARDING_TTL_DAYS } from '$lib/shared/project-management/invitation-ttl';

function formatInvitationExpiry(expiresAt: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'long',
		timeStyle: 'short'
	}).format(expiresAt);
}

export async function sendPmClientOnboardingEmail(input: {
	to: string;
	inviterName: string;
	workspaceName: string;
	projectTitle: string;
	onboardingUrl: string;
	origin: string;
	expiresAt: Date;
}): Promise<void> {
	const expiryLabel = formatInvitationExpiry(input.expiresAt);
	const content = {
		title: `Onboarding for ${input.projectTitle}`,
		greeting: 'there',
		logoUrl: resolveEmailLogoUrl(input.origin),
		illustrationUrl: resolveEmailAssetUrl(EMAIL_ASSETS.teamInvitation, input.origin),
		illustrationAlt: 'Project onboarding illustration',
		illustrationWidth: 400,
		preheader: `${input.inviterName} invited you to complete onboarding for ${input.projectTitle}.`,
		paragraphs: [
			`${input.inviterName} from ${input.workspaceName} invited you to share project details for ${input.projectTitle}.`,
			`This link expires on ${expiryLabel} (${PM_CLIENT_ONBOARDING_TTL_DAYS} days from when it was sent).`,
			'Use the button below to tell us about your project goals, scope, branding, and any website or hosting details.'
		],
		ctaLabel: 'Complete onboarding',
		ctaUrl: input.onboardingUrl,
		infoBoxParagraphs: [
			'No account is required — just open the link and submit the form.',
			'If you have questions, reply to the person who sent this invitation.'
		],
		footerNoteParagraphs: [
			'If you did not expect this invitation, you can safely ignore this email.'
		]
	};

	await sendMail({
		to: input.to,
		subject: `Complete onboarding for ${input.projectTitle}`,
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
