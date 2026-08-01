import type { RequestHandler } from './$types';
import { resetPasswordWithToken } from '$lib/server/auth/password-reset';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { PASSWORD_REUSE_MESSAGE, PASSWORD_WEAK_MESSAGE } from '$lib/shared/auth-messages';
import { resetPasswordSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = resetPasswordSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const recaptcha = await assertAuthRecaptcha({
		token: parsed.data.recaptchaToken,
		action: RECAPTCHA_ACTIONS.RESET_PASSWORD,
		remoteIp: getClientAddress()
	});

	if (!recaptcha.ok) {
		return jsonError('BAD_REQUEST', recaptcha.message, { requestId });
	}

	const result = await resetPasswordWithToken({
		token: parsed.data.token,
		password: parsed.data.password,
		origin: url.origin
	});

	if (!result.ok) {
		if (result.reason === 'INVALID_TOKEN') {
			return jsonError('BAD_REQUEST', 'Reset link is invalid or has expired', { requestId });
		}

		if (result.reason === 'PASSWORD_REUSED') {
			return jsonError('BAD_REQUEST', PASSWORD_REUSE_MESSAGE, {
				details: { code: 'PASSWORD_REUSE' },
				requestId
			});
		}

		if (result.reason === 'WEAK_PASSWORD') {
			return jsonError('BAD_REQUEST', PASSWORD_WEAK_MESSAGE, {
				details: { code: 'WEAK_PASSWORD' },
				requestId
			});
		}

		return jsonError('INTERNAL_ERROR', 'Unable to update password', { requestId });
	}

	return jsonOk({ passwordUpdated: true }, { requestId });
};
