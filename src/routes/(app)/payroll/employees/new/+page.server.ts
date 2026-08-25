import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	PAYROLL_EMPLOYEE_CODE_TAKEN_MESSAGE,
	PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE,
	PAYROLL_EMPLOYEE_CREATED_MESSAGE
} from '$lib/shared/payroll/messages';
import {
	createPayrollEmployeeForWorkspace,
	isDuplicatePayrollEmployeeCodeError
} from '$lib/server/repositories/payroll-employees';
import { listDtrWorkSchedulesForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import { applyPayrollEmployeePhotoChanges } from '$lib/server/payroll/employee-photo-actions';
import { parsePayrollEmployeeFormSubmission } from '$lib/server/payroll/employee-form-submission';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManagePayroll } from '$lib/shared/payroll/access';
import { buildPhDeductionIconUrlMap } from '$lib/server/payroll/deduction-icons';
import {
	createPayrollEmployeeSchema,
	createPayrollEmployeeDefaults
} from '$lib/shared/payroll/schemas';
import { buildEmployeeDeductionFormDefaults } from '$lib/shared/payroll/deductions';
import { mapActiveJobTitlesForEmployeeForm } from '$lib/shared/payroll/job-titles';

function buildEmployeeFormDefaults(
	deductionTypes: Awaited<ReturnType<typeof getPayrollSettingsForWorkspace>>['deductionTypes']
) {
	return {
		...createPayrollEmployeeDefaults,
		deductions: buildEmployeeDeductionFormDefaults(deductionTypes)
	};
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace, canManagePayroll: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(createPayrollEmployeeSchema), {
				defaults: createPayrollEmployeeDefaults
			}),
			payrollCurrency: 'PHP' as const,
			deductionTypes: [],
			workSchedules: [],
			jobTitles: [],
			phDeductionIconUrls: {}
		};
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const workSchedules = await listDtrWorkSchedulesForWorkspace(workspace.workspaceId);
	const form = await superValidate(zod4(createPayrollEmployeeSchema), {
		defaults: buildEmployeeFormDefaults(settings.deductionTypes)
	});

	const phDeductionIconUrls =
		settings.currency === 'PHP' ? buildPhDeductionIconUrlMap(url.origin) : {};

	return {
		form,
		payrollCurrency: settings.currency,
		deductionTypes: settings.deductionTypes.filter((type) => type.isActive),
		workSchedules,
		jobTitles: mapActiveJobTitlesForEmployeeForm(settings.jobTitles, settings.currency),
		phDeductionIconUrls
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const { form, photo } = await parsePayrollEmployeeFormSubmission(request);

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
			const employee = await createPayrollEmployeeForWorkspace({
				workspaceId: workspace.workspaceId,
				data: form.data,
				currency: settings.currency
			});

			if (photo) {
				const photoResult = await applyPayrollEmployeePhotoChanges({
					workspaceId: workspace.workspaceId,
					employeeId: employee.id,
					photo
				});

				if (!photoResult.ok) {
					return message(form, photoResult.message, { status: 400 });
				}
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

			return message(form, PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PAYROLL_EMPLOYEE_CREATED_MESSAGE);
	}
};
