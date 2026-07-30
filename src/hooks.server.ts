import type { Handle } from '@sveltejs/kit';
import { applyCorsHeaders, getCorsHeaders, isApiRoute } from '$lib/server/api/cors';

export const handle: Handle = async ({ event, resolve }) => {
	const origin = event.request.headers.get('origin');
	const pathname = event.url.pathname;

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
