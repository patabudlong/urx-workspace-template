import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { countWorkspaceSmsMessages } from '$lib/server/repositories/workspace-sms-messages';
import { isWorkspaceSmsConfigured } from '$lib/server/workspace-sms';
import { requireSmsWorkspace } from '$lib/server/workspace-sms/api-context';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireSmsWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const messageCount = await countWorkspaceSmsMessages(context.workspace.workspaceId);

	return jsonOk(
		{
			enabled: true,
			configured: isWorkspaceSmsConfigured(),
			workspaceId: context.workspace.workspaceId,
			messageCount
		},
		{ requestId }
	);
};
