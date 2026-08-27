import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { isWorkspaceSmsConfigured, sendWorkspaceSms } from '$lib/server/workspace-sms';
import { requireSmsWorkspace } from '$lib/server/workspace-sms/api-context';
import {
	WORKSPACE_SMS_NOT_CONFIGURED_MESSAGE,
	WORKSPACE_SMS_SEND_FAILED_MESSAGE
} from '$lib/shared/workspace-sms/messages';
import { sendWorkspaceSmsSchema } from '$lib/shared/workspace-sms/schemas';

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireSmsWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	if (!isWorkspaceSmsConfigured()) {
		return jsonError('SERVICE_UNAVAILABLE', WORKSPACE_SMS_NOT_CONFIGURED_MESSAGE, { requestId });
	}

	const parsed = sendWorkspaceSmsSchema.safeParse(await request.json());
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	try {
		const result = await sendWorkspaceSms({
			workspaceId: context.workspace.workspaceId,
			sentByUserId: locals.user!.id,
			message: parsed.data
		});

		return jsonOk(result, { requestId });
	} catch (error) {
		return jsonError(
			'BAD_REQUEST',
			error instanceof Error ? error.message : WORKSPACE_SMS_SEND_FAILED_MESSAGE,
			{ requestId }
		);
	}
};
