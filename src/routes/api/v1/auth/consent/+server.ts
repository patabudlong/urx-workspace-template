import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { recordConsentEvent } from '$lib/server/repositories/consent-events';
import { recordConsentSchema } from '$lib/shared/schemas/consent';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = recordConsentSchema.safeParse(body);

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const event = await recordConsentEvent({
		type: parsed.data.type,
		context: parsed.data.context,
		ipAddress: getClientAddress(),
		userAgent: request.headers.get('user-agent') ?? undefined,
		email: parsed.data.email,
		policyVersion: parsed.data.policyVersion
	});

	return jsonOk(
		{
			id: event._id.toString(),
			recordedAt: event.createdAt.toISOString()
		},
		{ requestId, status: 201 }
	);
};
