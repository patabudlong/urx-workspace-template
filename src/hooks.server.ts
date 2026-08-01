import type { Handle } from '@sveltejs/kit';
import { applyCorsHeaders, getCorsHeaders, isApiRoute } from '$lib/server/api/cors';
import { jsonError } from '$lib/server/api/response';
import { verifyAccessToken } from '$lib/server/auth/jwt';
import { clearSessionCookie, SESSION_COOKIE_NAME } from '$lib/server/auth/session';
import {
	applyPrivateNoStoreHeaders,
	isSensitiveHtmlRoute
} from '$lib/server/http/cache-control';
import {
	consumeAuthRateLimit,
	getAuthRateLimitMessage,
	isAuthApiRateLimitedRoute,
	isAuthOAuthRateLimitedRoute
} from '$lib/server/security/auth-rate-limit';
import { CONSENT_CONTEXTS } from '$lib/shared/models/consent-event';

export const handle: Handle = async ({ event, resolve }) => {
	const origin = event.request.headers.get('origin');
	const pathname = event.url.pathname;
	const method = event.request.method;
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);

	if (isAuthApiRateLimitedRoute(pathname, method) || isAuthOAuthRateLimitedRoute(pathname, method)) {
		const rateLimit = consumeAuthRateLimit({
			clientIp: event.getClientAddress(),
			pathname
		});

		if (!rateLimit.ok) {
			const retryAfter = String(rateLimit.retryAfterSeconds);
			const message = getAuthRateLimitMessage();

			if (isApiRoute(pathname)) {
				return jsonError('RATE_LIMITED', message, {
					requestId: event.request.headers.get('x-request-id') ?? undefined,
					headers: { 'Retry-After': retryAfter }
				});
			}

			const context = event.url.searchParams.get('context');
			const returnPath =
				context === CONSENT_CONTEXTS.SIGNUP ? '/signup' : '/login';

			return new Response(null, {
				status: 303,
				headers: {
					Location: `${returnPath}?error=rate_limited&retry=${retryAfter}`,
					'Retry-After': retryAfter
				}
			});
		}
	}

	if (sessionToken) {
		const payload = await verifyAccessToken(sessionToken);

		if (payload) {
			event.locals.user = {
				id: payload.sub,
				email: payload.email
			};
		} else {
			clearSessionCookie(event.cookies);
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

	if (!isApiRoute(pathname) && isSensitiveHtmlRoute(event.route.id)) {
		applyPrivateNoStoreHeaders(response.headers);
	}

	if (isApiRoute(pathname)) {
		return applyCorsHeaders(response, origin);
	}

	return response;
};
