import type { RequestHandler } from './$types';
import { requestVerificationEmail } from '$lib/server/auth/email-verification';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { RESEND_VERIFICATION_SUCCESS_MESSAGE } from '$lib/shared/auth-messages';
import { resendVerificationSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = resendVerificationSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const recaptcha = await assertAuthRecaptcha({
		token: parsed.data.recaptchaToken,
		action: RECAPTCHA_ACTIONS.RESEND_VERIFICATION,
		remoteIp: getClientAddress()
	});

	if (!recaptcha.ok) {
		return jsonError('BAD_REQUEST', recaptcha.message, { requestId });
	}

	const result = await requestVerificationEmail({
		email: parsed.data.email,
		origin: url.origin
	});

	if (!result.ok) {
		if (result.reason === 'MAIL_NOT_CONFIGURED') {
			return jsonError('SERVICE_UNAVAILABLE', 'Email is not configured', { requestId });
		}

		return jsonError('SERVICE_UNAVAILABLE', 'Unable to send verification email', { requestId });
	}

	return jsonOk({ message: RESEND_VERIFICATION_SUCCESS_MESSAGE }, { requestId });
};
