import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { pingDb } from '$lib/server/db/client';
import { isMailConfigured } from '$lib/server/mail/index';

export const GET: RequestHandler = async ({ request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const [db, mail] = await Promise.all([pingDb(), isMailConfigured()]);

	const status = db.ok && mail ? 'healthy' : 'degraded';

	return jsonOk(
		{
			status,
			services: {
				api: { ok: true },
				database: db,
				mail: { ok: mail }
			}
		},
		{
			status: db.ok ? 200 : 503,
			requestId
		}
	);
};
