import { isMailConfigured, sendMail } from '$lib/server/mail/index';
import {
	buildPlatformWorkspaceUrl,
	resolvePlatformWorkspaceOrigin
} from '$lib/server/mail/platform-origin';
import {
	buildTwoFactorCodeEmailHtml,
	buildTwoFactorCodeEmailText,
	buildTwoFactorStatusEmailHtml,
	buildTwoFactorStatusEmailText,
	TWO_FACTOR_EMAIL_ILLUSTRATIONS,
	type TwoFactorEmailIllustration,
	type TwoFactorStatusChange
} from '$lib/server/mail/templates/two-factor-email';
import { formatEmailDateTime } from '$lib/shared/format-datetime';
import { formatUserAgentLabel } from '$lib/shared/format-user-agent';
import type { TwoFactorMethod } from '$lib/shared/models/two-factor';

export type TwoFactorSecurityContext = {
	origin: string;
	ipAddress?: string;
	userAgent?: string;
};

export function resolveTwoFactorEmailAssets(
	origin: string,
	illustration: TwoFactorEmailIllustration = 'code'
): { logoUrl: string; illustrationUrl: string } {
	const platformOrigin = resolvePlatformWorkspaceOrigin(origin);

	return {
		logoUrl: `${platformOrigin}/email/urixoft-logo.png`,
		illustrationUrl: `${platformOrigin}/email/${TWO_FACTOR_EMAIL_ILLUSTRATIONS[illustration]}`
	};
}

export async function sendTwoFactorEmailCode(input: {
	email: string;
	firstName: string;
	code: string;
	origin: string;
}): Promise<void> {
	const greeting = input.firstName.trim() || 'there';
	const assets = resolveTwoFactorEmailAssets(input.origin, 'code');
	const content = {
		greeting,
		code: input.code,
		...assets
	};

	await sendMail({
		to: input.email,
		subject: 'Your Urixoft verification code',
		text: buildTwoFactorCodeEmailText(content),
		html: buildTwoFactorCodeEmailHtml(content)
	});
}

export async function sendTwoFactorStatusEmail(input: {
	to: string;
	firstName: string;
	change: TwoFactorStatusChange;
	method?: TwoFactorMethod;
	changedAt: Date;
	security?: TwoFactorSecurityContext;
}): Promise<void> {
	if (!(await isMailConfigured())) {
		return;
	}

	const origin = input.security?.origin;

	if (!origin) {
		return;
	}

	const greeting = input.firstName.trim() || 'there';
	const assets = resolveTwoFactorEmailAssets(origin, 'status');
	const secureAccountUrl = buildPlatformWorkspaceUrl(origin, '/security');
	const content = {
		greeting,
		change: input.change,
		method: input.method,
		changedAtLabel: formatEmailDateTime(input.changedAt),
		ipAddress: input.security?.ipAddress,
		deviceLabel: formatUserAgentLabel(input.security?.userAgent),
		secureAccountUrl,
		...assets
	};

	const subject =
		input.change === 'enabled'
			? 'Two-factor authentication enabled on your account'
			: 'Two-factor authentication disabled on your account';

	await sendMail({
		to: input.to,
		subject,
		text: buildTwoFactorStatusEmailText(content),
		html: buildTwoFactorStatusEmailHtml(content)
	});
}

export async function trySendTwoFactorStatusEmail(
	input: Parameters<typeof sendTwoFactorStatusEmail>[0]
): Promise<void> {
	try {
		await sendTwoFactorStatusEmail(input);
	} catch (error) {
		console.error('Failed to send two-factor status email', error);
	}
}
