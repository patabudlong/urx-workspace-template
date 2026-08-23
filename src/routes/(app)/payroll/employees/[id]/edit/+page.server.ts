import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	deactivatePayrollEmployeeForWorkspace,
	getPayrollEmployeeForWorkspace,
	isDuplicatePayrollEmployeeCodeError,
	updatePayrollEmployeeForWorkspace
} from '$lib/server/repositories/payroll-employees';
import { listDtrWorkSchedulesForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManagePayroll } from '$lib/shared/payroll/access';
import { mapPayrollEmployeeToFormInput } from '$lib/shared/payroll/deductions';
import {
	PAYROLL_EMPLOYEE_CODE_TAKEN_MESSAGE,
	PAYROLL_EMPLOYEE_NOT_FOUND_MESSAGE,
	PAYROLL_EMPLOYEE_UPDATE_FAILED_MESSAGE,
	PAYROLL_EMPLOYEE_UPDATED_MESSAGE
} from '$lib/shared/payroll/messages';
import { updatePayrollEmployeeSchema } from '$lib/shared/payroll/schemas';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { workspace, canManagePayroll: canManage } = await parent();

	if (!workspace || !canManage) {
		error(403, 'Payroll access required.');
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const employee = await getPayrollEmployeeForWorkspace({
		workspaceId: workspace.workspaceId,
		employeeId: params.id
	});

	if (!employee) {
		error(404, PAYROLL_EMPLOYEE_NOT_FOUND_MESSAGE);
	}

	const deductionTypes = settings.deductionTypes.filter((type) => type.isActive);
	const workSchedules = await listDtrWorkSchedulesForWorkspace(workspace.workspaceId);
	const defaults = mapPayrollEmployeeToFormInput(employee, deductionTypes, settings.currency);
	const form = await superValidate(zod4(updatePayrollEmployeeSchema), { defaults });

	return {
		form,
		employee,
		payrollCurrency: settings.currency,
		deductionTypes,
		workSchedules: workSchedules.map(({ id, name }) => ({ id, name }))
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(updatePayrollEmployeeSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManagePayroll(workspace.role)) {
			return fail(403, { form, message: 'Payroll access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);

		try {
			const updated = await updatePayrollEmployeeForWorkspace({
				workspaceId: workspace.workspaceId,
				employeeId: params.id,
				data: form.data,
				currency: settings.currency
			});

			if (!updated) {
				return message(form, PAYROLL_EMPLOYEE_NOT_FOUND_MESSAGE, { status: 404 });
			}
		} catch (error) {
			if (error instanceof Error && error.message === 'Invalid work schedule') {
				return message(form, 'Selected work schedule is invalid or no longer available.', {
					status: 400
				});
			}

			if (isDuplicatePayrollEmployeeCodeError(error)) {
				return message(form, PAYROLL_EMPLOYEE_CODE_TAKEN_MESSAGE, { status: 400 });
			}

			return message(form, PAYROLL_EMPLOYEE_UPDATE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PAYROLL_EMPLOYEE_UPDATED_MESSAGE);
	},
	deactivate: async ({ url, locals, params }) => {
		if (!locals.user) {
			error(401, 'Authentication required.');
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManagePayroll(workspace.role)) {
			error(403, 'Payroll access required.');
		}

		const deactivated = await deactivatePayrollEmployeeForWorkspace({
			workspaceId: workspace.workspaceId,
			employeeId: params.id
		});

		if (!deactivated) {
			error(404, PAYROLL_EMPLOYEE_NOT_FOUND_MESSAGE);
		}

		throw redirect(303, '/payroll/employees?deactivated=1');
	}
};
