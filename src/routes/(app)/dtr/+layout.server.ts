import type { LayoutServerLoad } from './$types';
import { canManageDtr } from '$lib/shared/dtr/access';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	return {
		canManageDtr: workspace ? canManageDtr(workspace.role) : false
	};
};
