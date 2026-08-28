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

export async function sendPmClientDocumentsEmail(input: {
	to: string;
	inviterName: string;
	workspaceName: string;
	projectTitle: string;
	documentsUrl: string;
	origin: string;
	expiresAt: Date;
	isReminder: boolean;
}): Promise<void> {
	const expiryLabel = formatInvitationExpiry(input.expiresAt);
	const content = {
		title: input.isReminder
			? `Reminder: documents for ${input.projectTitle}`
			: `Documents needed for ${input.projectTitle}`,
		greeting: 'there',
		logoUrl: resolveEmailLogoUrl(input.origin),
		illustrationUrl: resolveEmailAssetUrl(EMAIL_ASSETS.teamInvitation, input.origin),
		illustrationAlt: 'Project documents illustration',
		illustrationWidth: 400,
		preheader: input.isReminder
			? `${input.inviterName} sent a reminder to upload documents for ${input.projectTitle}.`
			: `${input.inviterName} invited you to upload documents for ${input.projectTitle}.`,
		paragraphs: input.isReminder
			? [
					`This is a friendly reminder from ${input.inviterName} at ${input.workspaceName} about documents for ${input.projectTitle}.`,
					`This link expires on ${expiryLabel} (${PM_CLIENT_ONBOARDING_TTL_DAYS} days from when it was sent).`,
					'Use the button below to upload the requested files.'
				]
			: [
					`${input.inviterName} from ${input.workspaceName} invited you to upload documents for ${input.projectTitle}.`,
					`This link expires on ${expiryLabel} (${PM_CLIENT_ONBOARDING_TTL_DAYS} days from when it was sent).`,
					'Use the button below to view the checklist and upload each requested file.'
				],
		ctaLabel: input.isReminder ? 'Upload documents' : 'Open document portal',
		ctaUrl: input.documentsUrl,
		infoBoxParagraphs: [
			'No account is required — just open the link and upload your files.',
			'If you have questions, reply to the person who sent this invitation.'
		],
		footerNoteParagraphs: [
			'If you did not expect this invitation, you can safely ignore this email.'
		]
	};

	await sendMail({
		to: input.to,
		subject: input.isReminder
			? `Reminder: upload documents for ${input.projectTitle}`
			: `Upload documents for ${input.projectTitle}`,
		text: buildSimpleEmailText(content),
		html: buildSimpleEmailHtml(content)
	});
}
