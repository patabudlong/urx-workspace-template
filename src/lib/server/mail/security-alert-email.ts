import { env } from '$env/dynamic/private';
import { isMailConfigured, sendMail } from '$lib/server/mail/index';
import { EMAIL_ASSETS, resolveEmailAssetUrl, resolveEmailLogoUrl } from '$lib/server/mail/email-assets';
import { buildAuthenticatedAppPathUrl } from '$lib/server/mail/platform-origin';
import {
	buildSecurityAlertEmailHtml,
	buildSecurityAlertEmailText
} from '$lib/server/mail/templates/security-alert-email';
import { findUserById } from '$lib/server/repositories/users';
import { formatEmailDateTime } from '$lib/shared/format-datetime';
import { formatUserAgentLabel } from '$lib/shared/format-user-agent';
import {
	resolveSecurityEmailCopy,
	SECURITY_EMAIL_KINDS,
	type SecurityEmailKind,
	type SecurityEmailLevel
} from '$lib/shared/mail/security-alert-email';

export type SecurityAlertEmailInput = {
	userId: string;
	level: SecurityEmailLevel;
	kind: SecurityEmailKind;
	origin?: string;
	ipAddress?: string;
	userAgent?: string;
	occurredAt?: Date;
};

function resolveSecurityEmailOrigin(origin?: string): string | null {
	const trimmed = origin?.trim();

	if (trimmed) {
		return trimmed;
	}

	const configured = env.PLATFORM_WORKSPACE_ORIGIN?.trim();

	return configured || null;
}

export async function sendSecurityAlertEmail(input: SecurityAlertEmailInput): Promise<void> {
	if (!(await isMailConfigured())) {
		return;
	}

	const origin = resolveSecurityEmailOrigin(input.origin);

	if (!origin) {
		console.warn('Skipping security alert email — no origin available');
		return;
	}

	const user = await findUserById(input.userId);

	if (!user?.email) {
		return;
	}

	const greeting = user.firstName.trim() || 'there';
	const occurredAt = input.occurredAt ?? new Date();
	const copy = resolveSecurityEmailCopy({ level: input.level, kind: input.kind });
	const secureAccountUrl = buildAuthenticatedAppPathUrl(
		origin,
		input.kind === SECURITY_EMAIL_KINDS.UNUSUAL_LOGIN ? '/security/activity' : '/security'
	);

	const content = {
		level: input.level,
		kind: input.kind,
		greeting,
		occurredAtLabel: formatEmailDateTime(occurredAt),
		ipAddress: input.ipAddress,
		deviceLabel: formatUserAgentLabel(input.userAgent),
		secureAccountUrl,
		logoUrl: resolveEmailLogoUrl(origin),
		illustrationUrl: resolveEmailAssetUrl(EMAIL_ASSETS.securityAlert, origin)
	};

	await sendMail({
		to: user.email,
		subject: copy.subject,
		text: buildSecurityAlertEmailText(content),
		html: buildSecurityAlertEmailHtml(content)
	});
}

export async function trySendSecurityAlertEmail(input: SecurityAlertEmailInput): Promise<void> {
	try {
		await sendSecurityAlertEmail(input);
	} catch (error) {
		console.error('Failed to send security alert email', {
			kind: input.kind,
			level: input.level,
			userId: input.userId,
			error
		});
	}
}
