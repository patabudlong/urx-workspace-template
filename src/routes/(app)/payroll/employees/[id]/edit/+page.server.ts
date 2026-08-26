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
import { applyPayrollEmployeePhotoChanges } from '$lib/server/payroll/employee-photo-actions';
import { parsePayrollEmployeeUpdateFormSubmission } from '$lib/server/payroll/employee-form-submission';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManagePayroll } from '$lib/shared/payroll/access';
import {
	buildSecurityEventRequestContext,
	recordPayrollSecurityEventInBackground
} from '$lib/server/security/record-security-event';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';
import { buildPhDeductionIconUrlMap } from '$lib/server/payroll/deduction-icons';
import { mapPayrollEmployeeToFormInput } from '$lib/shared/payroll/deductions';
import {
	PAYROLL_EMPLOYEE_CODE_TAKEN_MESSAGE,
	PAYROLL_EMPLOYEE_NOT_FOUND_MESSAGE,
	PAYROLL_EMPLOYEE_UPDATE_FAILED_MESSAGE,
	PAYROLL_EMPLOYEE_UPDATED_MESSAGE
} from '$lib/shared/payroll/messages';
import { updatePayrollEmployeeSchema } from '$lib/shared/payroll/schemas';
import { buildPayrollEmployeePhotoDisplayUrl } from '$lib/shared/payroll/employee-photo';
import { mapActiveJobTitlesForEmployeeForm } from '$lib/shared/payroll/job-titles';

export const load: PageServerLoad = async ({ parent, params, url }) => {
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

	const phDeductionIconUrls =
		settings.currency === 'PHP' ? buildPhDeductionIconUrlMap(url.origin) : {};

	return {
		form,
		employee,
		employeePhotoUrl: buildPayrollEmployeePhotoDisplayUrl({
			photoUrl: employee.photoUrl,
			updatedAt: employee.updatedAt
		}),
		payrollCurrency: settings.currency,
		deductionTypes,
		workSchedules: workSchedules.map(({ id, name }) => ({ id, name })),
		jobTitles: mapActiveJobTitlesForEmployeeForm(settings.jobTitles, settings.currency),
		phDeductionIconUrls
	};
};

export const actions: Actions = {
	update: async (event) => {
		const { request, url, locals, params } = event;
		const { form, photo, removePhoto } = await parsePayrollEmployeeUpdateFormSubmission(request);

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

			if (photo || removePhoto) {
				const photoResult = await applyPayrollEmployeePhotoChanges({
					workspaceId: workspace.workspaceId,
					employeeId: params.id,
					photo,
					removePhoto
				});

				if (!photoResult.ok) {
					return message(form, photoResult.message, { status: 400 });
				}
			}

			recordPayrollSecurityEventInBackground(event, {
				workspaceId: workspace.workspaceId,
				actorUserId: locals.user.id,
				action: SECURITY_EVENT_ACTIONS.PAYROLL_EMPLOYEE_UPDATED,
				...buildSecurityEventRequestContext(event),
				metadata: {
					detail: `Updated employee ${updated.fullName} (${updated.employeeCode}).`,
					employeeId: updated.id,
					employeeCode: updated.employeeCode,
					fullName: updated.fullName
				}
			});
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
	deactivate: async (event) => {
		const { url, locals, params } = event;
		if (!locals.user) {
			error(401, 'Authentication required.');
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManagePayroll(workspace.role)) {
			error(403, 'Payroll access required.');
		}

		const employee = await getPayrollEmployeeForWorkspace({
			workspaceId: workspace.workspaceId,
			employeeId: params.id
		});

		if (!employee) {
			error(404, PAYROLL_EMPLOYEE_NOT_FOUND_MESSAGE);
		}

		const deactivated = await deactivatePayrollEmployeeForWorkspace({
			workspaceId: workspace.workspaceId,
			employeeId: params.id
		});

		if (!deactivated) {
			error(404, PAYROLL_EMPLOYEE_NOT_FOUND_MESSAGE);
		}

		recordPayrollSecurityEventInBackground(event, {
			workspaceId: workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_EMPLOYEE_DEACTIVATED,
			...buildSecurityEventRequestContext(event),
			metadata: {
				detail: `Deactivated employee ${employee.fullName} (${employee.employeeCode}).`,
				employeeId: employee.id,
				employeeCode: employee.employeeCode,
				fullName: employee.fullName
			}
		});

		throw redirect(303, '/payroll/employees?deactivated=1');
	}
};
