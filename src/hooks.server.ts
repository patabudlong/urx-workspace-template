import type { Handle } from '@sveltejs/kit';
import { applyCorsHeaders, getCorsHeaders, isApiRoute } from '$lib/server/api/cors';
import { verifyAccessToken } from '$lib/server/auth/jwt';
import { SESSION_COOKIE_NAME } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const origin = event.request.headers.get('origin');
	const pathname = event.url.pathname;
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);

	if (sessionToken) {
		const payload = await verifyAccessToken(sessionToken);

		if (payload) {
			event.locals.user = {
				id: payload.sub,
				email: payload.email
			};
		} else {
			event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		}
	}

	const bearer = event.request.headers.get('authorization');
	if (!event.locals.user && bearer?.startsWith('Bearer ')) {
		const token = bearer.slice(7).trim();
		const payload = await verifyAccessToken(token);

		if (payload) {
			event.locals.user = {
				id: payload.sub,
				email: payload.email
			};
		}
	}

	if (isApiRoute(pathname) && event.request.method === 'OPTIONS') {
		const headers = getCorsHeaders(origin);
		headers.set('Content-Length', '0');

		return new Response(null, {
			status: 204,
			headers
		});
	}

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');

	if (isApiRoute(pathname)) {
		return applyCorsHeaders(response, origin);
	}

	return response;
};
