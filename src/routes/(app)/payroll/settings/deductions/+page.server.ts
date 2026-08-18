import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	getPayrollDeductionTypesFormDefaults,
	getPayrollSettingsForWorkspace,
	savePayrollDeductionTypesForWorkspace
} from '$lib/server/repositories/payroll-settings';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManagePayroll } from '$lib/shared/payroll/access';
import {
	PAYROLL_DEDUCTION_TYPES_SAVED_MESSAGE,
	PAYROLL_DEDUCTION_TYPES_SAVE_FAILED_MESSAGE
} from '$lib/shared/payroll/messages';
import {
	mapDeductionTypesInputToDocument,
	payrollDeductionTypesSchema
} from '$lib/shared/payroll/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManagePayroll: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(payrollDeductionTypesSchema), {
				defaults: { types: [] }
			}),
			payrollCurrency: 'PHP' as const
		};
	}

	const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
	const form = await superValidate(
		getPayrollDeductionTypesFormDefaults(settings.deductionTypes),
		zod4(payrollDeductionTypesSchema)
	);

	return {
		form,
		payrollCurrency: settings.currency
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(payrollDeductionTypesSchema));

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

		try {
			const settings = await getPayrollSettingsForWorkspace(workspace.workspaceId);
			await savePayrollDeductionTypesForWorkspace({
				workspaceId: workspace.workspaceId,
				types: mapDeductionTypesInputToDocument(form.data.types, settings.currency)
			});
		} catch {
			return message(form, PAYROLL_DEDUCTION_TYPES_SAVE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PAYROLL_DEDUCTION_TYPES_SAVED_MESSAGE);
	}
};
