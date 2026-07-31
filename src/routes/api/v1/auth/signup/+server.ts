import type { RequestHandler } from './$types';
import { registerWithCredentials } from '$lib/server/auth/signup';
import { requestVerificationEmail } from '$lib/server/auth/email-verification';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { recordEmailSignupConsent } from '$lib/server/repositories/consent-events';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { SIGNUP_VERIFICATION_SENT_MESSAGE } from '$lib/shared/auth-messages';
import { signupSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
import { LEGAL_POLICY_VERSION } from '$lib/shared/legal';

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = signupSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const recaptcha = await assertAuthRecaptcha({
		token: parsed.data.recaptchaToken,
		action: RECAPTCHA_ACTIONS.SIGNUP,
		remoteIp: getClientAddress()
	});

	if (!recaptcha.ok) {
		return jsonError('BAD_REQUEST', recaptcha.message, { requestId });
	}

	const ipAddress = getClientAddress();
	const termsConsent = {
		acceptedAt: new Date(),
		ipAddress,
		policyVersion: LEGAL_POLICY_VERSION
	};

	const result = await registerWithCredentials({
		firstName: parsed.data.firstName,
		lastName: parsed.data.lastName,
		email: parsed.data.email,
		password: parsed.data.password,
		termsConsent
	});

	if (!result.ok) {
		return jsonError('CONFLICT', 'An account with this email already exists', { requestId });
	}

	await recordEmailSignupConsent({
		userId: result.user.id,
		email: parsed.data.email,
		ipAddress,
		userAgent: request.headers.get('user-agent') ?? undefined,
		policyVersion: LEGAL_POLICY_VERSION
	});

	const emailResult = await requestVerificationEmail({
		email: parsed.data.email,
		origin: url.origin
	});

	if (!emailResult.ok) {
		if (emailResult.reason === 'MAIL_NOT_CONFIGURED') {
			return jsonError('SERVICE_UNAVAILABLE', 'Email is not configured', { requestId });
		}

		return jsonError('SERVICE_UNAVAILABLE', 'Unable to send verification email', { requestId });
	}

	return jsonOk(
		{
			user: result.user,
			message: SIGNUP_VERIFICATION_SENT_MESSAGE
		},
		{ requestId, status: 201 }
	);
};
