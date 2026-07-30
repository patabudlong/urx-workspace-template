import type { RequestHandler } from './$types';
import { createOpenApiV1Document } from '$lib/shared/openapi/v1';

export const GET: RequestHandler = ({ url }) => {
	const document = createOpenApiV1Document(url.origin);

	return new Response(JSON.stringify(document), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-cache'
		}
	});
};
