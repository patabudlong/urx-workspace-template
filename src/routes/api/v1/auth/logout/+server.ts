import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { clearSessionCookie } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	clearSessionCookie(cookies);

	return jsonOk({ loggedOut: true }, { requestId });
};

export const GET: RequestHandler = async ({ cookies, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	clearSessionCookie(cookies);

	return jsonOk({ loggedOut: true }, { requestId });
};
