import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { pingDb } from '$lib/server/db/client';

export const GET: RequestHandler = async ({ request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const db = await pingDb();

	const status = db.ok ? 'healthy' : 'degraded';

	return jsonOk(
		{
			status,
			services: {
				api: { ok: true },
				database: db
			}
		},
		{
			status: db.ok ? 200 : 503,
			requestId
		}
	);
};
