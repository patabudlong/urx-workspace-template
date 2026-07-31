import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { checkWorkspaceAvailability } from '$lib/server/onboarding/workspace-availability';
import { workspaceAvailabilityQuerySchema } from '$lib/shared/schemas/workspace-availability';

export const GET: RequestHandler = async ({ url, locals, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required.', { requestId });
	}

	const parsed = workspaceAvailabilityQuerySchema.safeParse({
		name: url.searchParams.get('name') ?? undefined,
		slug: url.searchParams.get('slug') ?? undefined
	});

	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid query parameters.', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const availability = await checkWorkspaceAvailability(parsed.data);

	return jsonOk(availability, { requestId });
};
