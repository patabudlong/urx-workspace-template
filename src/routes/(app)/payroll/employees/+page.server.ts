import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	createPayrollEmployeeForWorkspace,
	listPayrollEmployeesForWorkspace
} from '$lib/server/repositories/payroll-employees';
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

const DEFAULT_LIMIT = 50;

export const load: PageServerLoad = async ({ parent, isDataRequest }) => {
	const { workspace, canManagePayroll: canManage } = await parent();
	const form = await superValidate(zod4(createPayrollEmployeeSchema), {
		defaults: createPayrollEmployeeDefaults
	});

	if (!workspace || !canManage) {
		return {
			form,
			employees: [],
			payrollCurrency: 'PHP' as const
		};
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const employeesQuery = listPayrollEmployeesForWorkspace({
		workspaceId: workspace.workspaceId,
		page: 1,
		limit: DEFAULT_LIMIT
	}).then((result) => result.items);

	return {
		form,
		payrollCurrency: settings.currency,
		employees: isDataRequest ? employeesQuery : await employeesQuery
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
		} catch {
			return message(form, PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PAYROLL_EMPLOYEE_CREATED_MESSAGE);
	}
};
