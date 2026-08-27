import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { isWorkspaceSmsConfigured, sendWorkspaceSms } from '$lib/server/workspace-sms';
import {
	WORKSPACE_SMS_NOT_CONFIGURED_MESSAGE,
	WORKSPACE_SMS_SEND_FAILED_MESSAGE,
	WORKSPACE_SMS_SEND_SUCCESS_MESSAGE
} from '$lib/shared/workspace-sms/messages';
import { sendWorkspaceSmsSchema } from '$lib/shared/workspace-sms/schemas';

export const load: PageServerLoad = async () => {
	return {
		configured: isWorkspaceSmsConfigured(),
		meta: {
			title: 'Send SMS'
		}
	};
};

export const actions: Actions = {
	default: async ({ locals, request, url }) => {
		if (!locals.user?.id) {
			return fail(401);
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace) {
			return fail(400);
		}

		if (!isWorkspaceSmsConfigured()) {
			return fail(400, { message: WORKSPACE_SMS_NOT_CONFIGURED_MESSAGE });
		}

		const formData = await request.formData();
		const parsed = sendWorkspaceSmsSchema.safeParse({
			to: formData.get('to'),
			body: formData.get('body')
		});

		if (!parsed.success) {
			return fail(400, {
				message: parsed.error.issues[0]?.message ?? 'Invalid message',
				values: {
					to: String(formData.get('to') ?? ''),
					body: String(formData.get('body') ?? '')
				}
			});
		}

		try {
			await sendWorkspaceSms({
				workspaceId: workspace.workspaceId,
				sentByUserId: locals.user.id,
				message: parsed.data
			});
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : WORKSPACE_SMS_SEND_FAILED_MESSAGE,
				values: parsed.data
			});
		}

		return {
			message: WORKSPACE_SMS_SEND_SUCCESS_MESSAGE,
			values: { to: '', body: '' }
		};
	}
};
