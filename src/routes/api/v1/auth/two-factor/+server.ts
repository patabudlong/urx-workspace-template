import type { RequestHandler } from './$types';
import { verifyTwoFactorPendingToken } from '$lib/server/auth/jwt';
import {
	sendTwoFactorLoginCode,
	verifyTwoFactorChallenge
} from '$lib/server/auth/two-factor/challenge';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { INVALID_VERIFICATION_CODE_MESSAGE, createAuthRateLimitMessage } from '$lib/shared/auth-messages';
import { TWO_FACTOR_METHODS } from '$lib/shared/models/two-factor';
import { twoFactorLoginChallengeSchema } from '$lib/shared/schemas/security';
import { TWO_FACTOR_CODE_SENT_MESSAGE } from '$lib/shared/security-messages';
import { z } from 'zod';

const sendCodeSchema = z.object({
	method: z.enum([TWO_FACTOR_METHODS.SMS, TWO_FACTOR_METHODS.EMAIL])
});

export const POST: RequestHandler = async ({ request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const authHeader = request.headers.get('authorization');
	const pendingToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (!pendingToken) {
		return jsonError('UNAUTHORIZED', 'Two-factor pending token required', { requestId });
	}

	const payload = await verifyTwoFactorPendingToken(pendingToken);

	if (!payload) {
		return jsonError('UNAUTHORIZED', 'Invalid or expired two-factor session', { requestId });
	}

	const parsed = twoFactorLoginChallengeSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const result = await verifyTwoFactorChallenge({
		userId: payload.sub,
		code: parsed.data.code,
		method: parsed.data.method,
		rememberDevice: parsed.data.rememberDevice,
		deviceLabel: typeof body === 'object' && body && 'deviceLabel' in body
			? String((body as { deviceLabel?: string }).deviceLabel ?? '')
			: undefined
	});

	if (!result.ok) {
		return jsonError('BAD_REQUEST', INVALID_VERIFICATION_CODE_MESSAGE, { requestId });
	}

	return jsonOk(
		{
			accessToken: result.session.accessToken,
			tokenType: 'Bearer',
			expiresIn: result.session.expiresIn,
			user: result.session.user,
			trustedDevice: result.trustedDevice ?? null
		},
		{ requestId }
	);
};

export const PUT: RequestHandler = async ({ request, url, getClientAddress }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const authHeader = request.headers.get('authorization');
	const pendingToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (!pendingToken) {
		return jsonError('UNAUTHORIZED', 'Two-factor pending token required', { requestId });
	}

	const payload = await verifyTwoFactorPendingToken(pendingToken);

	if (!payload) {
		return jsonError('UNAUTHORIZED', 'Invalid or expired two-factor session', { requestId });
	}

	const parsed = sendCodeSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const sent = await sendTwoFactorLoginCode({
		userId: payload.sub,
		method: parsed.data.method,
		origin: url.origin,
		clientIp: getClientAddress()
	});

	if (!sent.ok) {
		if (sent.reason === 'THROTTLED') {
			return jsonError('RATE_LIMITED', createAuthRateLimitMessage(sent.retryAfterSeconds ?? 60).text, {
				requestId,
				headers: { 'Retry-After': String(sent.retryAfterSeconds ?? 60) }
			});
		}

		return jsonError('BAD_REQUEST', 'Could not send verification code', { requestId });
	}

	return jsonOk({ message: TWO_FACTOR_CODE_SENT_MESSAGE }, { requestId });
};
