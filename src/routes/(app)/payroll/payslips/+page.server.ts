import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findPayrollEmployeeForWorkspaceUser } from '$lib/server/repositories/payroll-employees';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import { listPayrollPayslipsForEmployee } from '$lib/server/repositories/payroll-payslips';

const DEFAULT_LIMIT = 20;

export const load: PageServerLoad = async ({ parent, locals, isDataRequest }) => {
	const { workspace, canManagePayroll, hasLinkedPayrollEmployee } = await parent();

	if (!workspace) {
		error(403, 'Payroll access required');
	}

	let employeeId: string | null = null;

	if (canManagePayroll) {
		if (locals.user?.id) {
			const employee = await findPayrollEmployeeForWorkspaceUser({
				workspaceId: workspace.workspaceId,
				userId: locals.user.id,
				email: locals.user.email
			});
			employeeId = employee?.id ?? null;
		}
	} else if (hasLinkedPayrollEmployee && locals.user?.id) {
		const employee = await findPayrollEmployeeForWorkspaceUser({
			workspaceId: workspace.workspaceId,
			userId: locals.user.id,
			email: locals.user.email
		});
		employeeId = employee?.id ?? null;
	}

	if (!employeeId) {
		return {
			payslips: [],
			total: 0,
			currency: (await getPayrollSettingsForWorkspace(workspace.workspaceId)).currency,
			needsEmployeeLink: !canManagePayroll
		};
	}

	const payslipsQuery = listPayrollPayslipsForEmployee({
		workspaceId: workspace.workspaceId,
		employeeId,
		page: 1,
		limit: DEFAULT_LIMIT
	});

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);

	return {
		payslips: isDataRequest ? payslipsQuery.then((result) => result.items) : (await payslipsQuery).items,
		total: isDataRequest ? payslipsQuery.then((result) => result.total) : (await payslipsQuery).total,
		currency: settings.currency,
		needsEmployeeLink: false
	};
};
