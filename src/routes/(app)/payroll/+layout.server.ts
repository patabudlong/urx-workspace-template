import type { LayoutServerLoad } from './$types';
import { canManagePayroll } from '$lib/shared/payroll/access';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	return {
		canManagePayroll: workspace ? canManagePayroll(workspace.role) : false
	};
};
