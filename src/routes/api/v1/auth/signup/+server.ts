import type { RequestHandler } from './$types';
import { registerWithCredentials } from '$lib/server/auth/signup';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { signupSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
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

	const result = await registerWithCredentials({
		firstName: parsed.data.firstName,
		lastName: parsed.data.lastName,
		email: parsed.data.email,
		password: parsed.data.password
	});

	if (!result.ok) {
		if (result.reason === 'AUTH_NOT_CONFIGURED') {
			return jsonError('SERVICE_UNAVAILABLE', 'Authentication is not configured', { requestId });
		}

		return jsonError('CONFLICT', 'An account with this email already exists', { requestId });
	}

	return jsonOk(
		{
			accessToken: result.accessToken,
			tokenType: 'Bearer',
			expiresIn: result.expiresIn,
			user: result.user
		},
		{ requestId, status: 201 }
	);
};
