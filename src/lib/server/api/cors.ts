import { env } from '$env/dynamic/private';

const API_PREFIX = '/api/';

export function isApiRoute(pathname: string): boolean {
	return pathname.startsWith(API_PREFIX);
}

function getAllowedOrigins(): string[] {
	const configured = env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);

	if (configured?.length) {
		return configured;
	}

	if (import.meta.env.DEV) {
		return ['http://localhost:5173', 'http://127.0.0.1:5173'];
	}

	return [];
}

export function getCorsHeaders(requestOrigin: string | null): Headers {
	const headers = new Headers();
	const allowedOrigins = getAllowedOrigins();

	if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
		return headers;
	}

	headers.set('Access-Control-Allow-Origin', requestOrigin);
	headers.set('Vary', 'Origin');
	headers.set('Access-Control-Allow-Credentials', 'true');
	headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	headers.set(
		'Access-Control-Allow-Headers',
		'Authorization, Content-Type, Accept, X-Request-Id, X-Api-Version'
	);
	headers.set('Access-Control-Max-Age', '86400');

	return headers;
}

export function applyCorsHeaders(response: Response, requestOrigin: string | null): Response {
	const corsHeaders = getCorsHeaders(requestOrigin);

	if (corsHeaders.keys().next().done) {
		return response;
	}

	const headers = new Headers(response.headers);
	for (const [key, value] of corsHeaders.entries()) {
		headers.set(key, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
