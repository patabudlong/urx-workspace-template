import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

	return jsonOk({ loggedOut: true }, { requestId });
};

export const GET: RequestHandler = async ({ cookies, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	cookies.delete(SESSION_COOKIE_NAME, getSessionCookieOptions());

	return jsonOk({ loggedOut: true }, { requestId });
};
