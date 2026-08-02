import type { PageServerLoad } from './$types';
import { requireWorkspaceOwner } from '$lib/server/workspace-access';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	requireWorkspaceOwner(workspace);

	return {};
};
