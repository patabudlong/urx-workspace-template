import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { createPayrollEmployeeForWorkspace } from '$lib/server/repositories/payroll-employees';
import { listDtrWorkSchedulesForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManagePayroll } from '$lib/shared/payroll/access';
import {
	PAYROLL_EMPLOYEE_CREATED_MESSAGE,
	PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE
} from '$lib/shared/payroll/messages';
import {
	createPayrollEmployeeSchema,
	createPayrollEmployeeDefaults
} from '$lib/shared/payroll/schemas';
import { buildEmployeeDeductionFormDefaults } from '$lib/shared/payroll/deductions';

function buildEmployeeFormDefaults(
	deductionTypes: Awaited<ReturnType<typeof getPayrollSettingsForWorkspace>>['deductionTypes']
) {
	return {
		...createPayrollEmployeeDefaults,
		deductions: buildEmployeeDeductionFormDefaults(deductionTypes)
	};
}

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManagePayroll: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(createPayrollEmployeeSchema), {
				defaults: createPayrollEmployeeDefaults
			}),
			payrollCurrency: 'PHP' as const,
			deductionTypes: [],
			workSchedules: []
		};
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const workSchedules = await listDtrWorkSchedulesForWorkspace(workspace.workspaceId);
	const form = await superValidate(zod4(createPayrollEmployeeSchema), {
		defaults: buildEmployeeFormDefaults(settings.deductionTypes)
	});

	return {
		form,
		payrollCurrency: settings.currency,
		deductionTypes: settings.deductionTypes.filter((type) => type.isActive),
		workSchedules
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(createPayrollEmployeeSchema));

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
			await createPayrollEmployeeForWorkspace({
				workspaceId: workspace.workspaceId,
				data: form.data,
				currency: settings.currency
			});
		} catch (error) {
			if (error instanceof Error && error.message === 'Invalid work schedule') {
				return message(form, 'Selected work schedule is invalid or no longer available.', {
					status: 400
				});
			}

			return message(form, PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PAYROLL_EMPLOYEE_CREATED_MESSAGE);
	}
};
