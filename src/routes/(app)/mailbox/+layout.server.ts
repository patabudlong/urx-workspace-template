import type { LayoutServerLoad } from './$types';
import {
	getMailboxConnectionStatus,
	getMailboxSignature
} from '$lib/server/repositories/user-mailbox-credentials';
import { normalizeMailboxSignature } from '$lib/shared/mailbox/signature';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import { requireWorkspacePackage } from '$lib/server/workspace-packages/access';

export const load: LayoutServerLoad = async ({ locals, parent }) => {
	const { workspace } = await parent();
	requireWorkspacePackage(workspace, WORKSPACE_PACKAGE_IDS.MAILBOX);

	const connection = await getMailboxConnectionStatus(locals.user!.id);
	const configured = connection.connected;
	const signature = configured
		? normalizeMailboxSignature(await getMailboxSignature(locals.user!.id))
		: null;

	return {
		connection,
		configured,
		signature
	};
};
