import type { RequestHandler } from './$types';
import { authenticateWithCredentials } from '$lib/server/auth/login';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { loginSchema } from '$lib/shared/schemas/auth';

export const POST: RequestHandler = async ({ request }) => {
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

	const result = await authenticateWithCredentials(parsed.data.email, parsed.data.password);

	if (!result.ok) {
		if (result.reason === 'AUTH_NOT_CONFIGURED') {
			return jsonError('SERVICE_UNAVAILABLE', 'Authentication is not configured', { requestId });
		}

		return jsonError('UNAUTHORIZED', 'Invalid email or password', { requestId });
	}

	return jsonOk(
		{
			accessToken: result.accessToken,
			tokenType: 'Bearer',
			expiresIn: result.expiresIn,
			user: result.user
		},
		{ requestId }
	);
};
