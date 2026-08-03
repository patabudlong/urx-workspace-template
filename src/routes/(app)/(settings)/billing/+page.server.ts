import type { PageServerLoad } from './$types';
import { requireWorkspaceMember } from '$lib/server/workspace-access';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	return {
		meta: {
			title: 'Billing'
		}
	};
};
