import type { RequestHandler } from './$types';
import { authenticateWithCredentials } from '$lib/server/auth/login';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { EMAIL_NOT_VERIFIED_MESSAGE } from '$lib/shared/auth-messages';
import { loginSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = loginSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const [recaptcha, result] = await Promise.all([
		assertAuthRecaptcha({
			token: parsed.data.recaptchaToken,
			action: RECAPTCHA_ACTIONS.LOGIN,
			remoteIp: getClientAddress()
		}),
		authenticateWithCredentials(parsed.data.email, parsed.data.password)
	]);

	if (!recaptcha.ok) {
		return jsonError('BAD_REQUEST', recaptcha.message, { requestId });
	}

	if (!result.ok) {
		if (result.reason === 'AUTH_NOT_CONFIGURED') {
			return jsonError('SERVICE_UNAVAILABLE', 'Authentication is not configured', { requestId });
		}

		if (result.reason === 'EMAIL_NOT_VERIFIED') {
			return jsonError('FORBIDDEN', EMAIL_NOT_VERIFIED_MESSAGE, {
				details: { code: 'EMAIL_NOT_VERIFIED' },
				requestId
			});
		}

		return jsonError('UNAUTHORIZED', 'Invalid email or password', { requestId });
	}

	if ('twoFactorRequired' in result && result.twoFactorRequired) {
		return jsonOk(
			{
				twoFactorRequired: true,
				pendingToken: result.pendingToken,
				tokenType: 'Bearer',
				expiresIn: result.expiresIn,
				methods: result.methods
			},
			{ requestId }
		);
	}

	const session = result as {
		accessToken: string;
		expiresIn: number;
		user: import('$lib/shared/schemas/auth').AuthUser;
	};

	return jsonOk(
		{
			accessToken: session.accessToken,
			tokenType: 'Bearer',
			expiresIn: session.expiresIn,
			user: session.user
		},
		{ requestId }
	);
};
