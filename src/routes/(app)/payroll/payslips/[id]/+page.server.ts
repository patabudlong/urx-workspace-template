import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findPayrollEmployeeForWorkspaceUser } from '$lib/server/repositories/payroll-employees';
import { getPayrollPayslipForWorkspace } from '$lib/server/repositories/payroll-payslips';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import {
	PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE,
	PAYROLL_PAYSLIP_NOT_FOUND_MESSAGE
} from '$lib/shared/payroll/messages';

export const load: PageServerLoad = async ({ parent, params, locals }) => {
	const { workspace, canManagePayroll } = await parent();

	if (!workspace) {
		error(403, 'Payroll access required');
	}

	let employeeId: string | undefined;

	if (!canManagePayroll) {
		if (!locals.user?.email) {
			error(403, PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE);
		}

		const employee = await findPayrollEmployeeForWorkspaceUser({
			workspaceId: workspace.workspaceId,
			userId: locals.user.id,
			email: locals.user.email
		});

		if (!employee) {
			error(403, PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE);
		}

		employeeId = employee.id;
	}

	const payslip = await getPayrollPayslipForWorkspace({
		workspaceId: workspace.workspaceId,
		payslipId: params.id,
		employeeId
	});

	if (!payslip) {
		error(404, PAYROLL_PAYSLIP_NOT_FOUND_MESSAGE);
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);

	return {
		payslip,
		currency: settings.currency,
		canManagePayroll
	};
};
