/** Shared API contracts — safe to import from mobile app clients or codegen. */

export type ApiErrorCode =
	| 'BAD_REQUEST'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'RATE_LIMITED'
	| 'INTERNAL_ERROR'
	| 'SERVICE_UNAVAILABLE';

export type ApiErrorBody = {
	code: ApiErrorCode;
	message: string;
	details?: Record<string, unknown>;
};

export type ApiMeta = {
	requestId?: string;
	version: string;
	timestamp: string;
};

export type ApiSuccessResponse<T> = {
	data: T;
	meta: ApiMeta;
};

export type ApiErrorResponse = {
	error: ApiErrorBody;
	meta: ApiMeta;
};

export type PaginationMeta = {
	page: number;
	limit: number;
	total: number;
	hasMore: boolean;
};

export type PaginatedResponse<T> = ApiSuccessResponse<T> & {
	pagination: PaginationMeta;
};
