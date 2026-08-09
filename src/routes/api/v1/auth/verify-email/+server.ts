import type { RequestHandler } from './$types';
import { verifyEmailWithCode } from '$lib/server/auth/email-verification';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { verifyEmailSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = verifyEmailSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const recaptcha = await assertAuthRecaptcha({
		token: parsed.data.recaptchaToken,
		action: RECAPTCHA_ACTIONS.VERIFY_EMAIL,
		remoteIp: getClientAddress()
	});

	if (!recaptcha.ok) {
		return jsonError('BAD_REQUEST', recaptcha.message, { requestId });
	}

	const result = await verifyEmailWithCode({
		email: parsed.data.email,
		code: parsed.data.code
	});

	if (!result.ok) {
		if (result.reason === 'ALREADY_VERIFIED') {
			return jsonError('CONFLICT', 'Email is already verified', { requestId });
		}

		return jsonError('BAD_REQUEST', 'Invalid or expired verification code', { requestId });
	}

	return jsonOk({ verified: true }, { requestId });
};
