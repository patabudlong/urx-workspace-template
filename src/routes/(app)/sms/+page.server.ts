import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { countWorkspaceSmsMessages } from '$lib/server/repositories/workspace-sms-messages';
import { isWorkspaceSmsConfigured } from '$lib/server/workspace-sms';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	if (!workspace) {
		error(404, 'Not found');
	}

	return {
		configured: isWorkspaceSmsConfigured(),
		messageCount: countWorkspaceSmsMessages(workspace.workspaceId)
	};
};
