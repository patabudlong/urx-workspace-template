import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { clearSessionCookie } from '$lib/server/auth/session';
import { resolveWorkspaceIdFromRequest } from '$lib/server/security/request-workspace-context';
import { recordLogoutInBackground } from '$lib/server/security/record-security-event';

export const POST: RequestHandler = async ({ cookies, request, locals, platform, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (locals.user?.id) {
		const workspaceId = await resolveWorkspaceIdFromRequest({ locals, url });
		recordLogoutInBackground({ platform }, {
			userId: locals.user.id,
			ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
			userAgent: request.headers.get('user-agent') ?? undefined,
			workspaceId
		});
	}

	clearSessionCookie(cookies);

	return jsonOk({ loggedOut: true }, { requestId });
};

export const GET: RequestHandler = async ({ cookies, request, locals, platform, url, getClientAddress }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (locals.user?.id) {
		const workspaceId = await resolveWorkspaceIdFromRequest({ locals, url });
		recordLogoutInBackground({ platform }, {
			userId: locals.user.id,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') ?? undefined,
			workspaceId
		});
	}

	clearSessionCookie(cookies);

	return jsonOk({ loggedOut: true }, { requestId });
};
