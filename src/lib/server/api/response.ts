import type {
	ApiErrorBody,
	ApiErrorCode,
	ApiMeta,
	ApiSuccessResponse,
	PaginatedResponse,
	PaginationMeta
} from '$lib/shared/api/types';

export const API_VERSION = 'v1';

function createMeta(requestId?: string): ApiMeta {
	return {
		requestId,
		version: API_VERSION,
		timestamp: new Date().toISOString()
	};
}

export function jsonOk<T>(
	data: T,
	init?: ResponseInit & { requestId?: string }
): Response {
	const body: ApiSuccessResponse<T> = {
		data,
		meta: createMeta(init?.requestId)
	};

	return Response.json(body, {
		status: init?.status ?? 200,
		headers: init?.headers
	});
}

export function jsonPaginated<T>(
	data: T,
	pagination: PaginationMeta,
	init?: ResponseInit & { requestId?: string }
): Response {
	const body: PaginatedResponse<T> = {
		data,
		pagination,
		meta: createMeta(init?.requestId)
	};

	return Response.json(body, {
		status: init?.status ?? 200,
		headers: init?.headers
	});
}

export function jsonError(
	code: ApiErrorCode,
	message: string,
	init?: ResponseInit & { details?: Record<string, unknown>; requestId?: string }
): Response {
	const status = init?.status ?? errorStatus(code);
	const body = {
		error: {
			code,
			message,
			details: init?.details
		} satisfies ApiErrorBody,
		meta: createMeta(init?.requestId)
	};

	return Response.json(body, { status, headers: init?.headers });
}

function errorStatus(code: ApiErrorCode): number {
	switch (code) {
		case 'BAD_REQUEST':
			return 400;
		case 'UNAUTHORIZED':
			return 401;
		case 'FORBIDDEN':
			return 403;
		case 'NOT_FOUND':
			return 404;
		case 'CONFLICT':
			return 409;
		case 'RATE_LIMITED':
			return 429;
		case 'SERVICE_UNAVAILABLE':
			return 503;
		default:
			return 500;
	}
}
