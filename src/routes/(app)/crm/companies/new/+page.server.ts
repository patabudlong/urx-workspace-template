import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { createCrmCompany } from '$lib/server/repositories/crm-companies';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageCrm } from '$lib/shared/crm/access';
import {
	CRM_COMPANY_CREATE_FAILED_MESSAGE
} from '$lib/shared/crm/messages';
import {
	crmCompanyFormDefaults,
	crmCompanyFormSchema,
	mapCrmCompanyFormToCreateInput
} from '$lib/shared/crm/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageCrm: canManage } = await parent();

	return {
		form: await superValidate(zod4(crmCompanyFormSchema), { defaults: crmCompanyFormDefaults }),
		canManage
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(crmCompanyFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageCrm(workspace.role)) {
			return fail(403, { form, message: 'CRM access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const company = await createCrmCompany({
				workspaceId: workspace.workspaceId,
				data: mapCrmCompanyFormToCreateInput(form.data)
			});

			throw redirect(303, '/crm/companies?created=1');
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			return message(form, CRM_COMPANY_CREATE_FAILED_MESSAGE, { status: 500 });
		}
	}
};
