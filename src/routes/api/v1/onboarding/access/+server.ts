import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { getOnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';

export const GET: RequestHandler = async ({ locals, request }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!locals.user) {
		return jsonError('UNAUTHORIZED', 'Authentication required.', { requestId });
	}

	const access = await getOnboardingAccessState(locals.user.id);

	return jsonOk({ access }, { requestId });
};
