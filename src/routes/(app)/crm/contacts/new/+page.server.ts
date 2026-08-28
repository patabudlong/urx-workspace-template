import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { createCrmContact } from '$lib/server/repositories/crm-contacts';
import { listCrmCompaniesForWorkspace } from '$lib/server/repositories/crm-companies';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageCrm } from '$lib/shared/crm/access';
import {
	CRM_CONTACT_CREATE_FAILED_MESSAGE,
	CRM_CONTACT_CREATED_MESSAGE
} from '$lib/shared/crm/messages';
import {
	crmContactFormDefaults,
	crmContactFormSchema,
	mapCrmContactFormToCreateInput
} from '$lib/shared/crm/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageCrm: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(crmContactFormSchema), { defaults: crmContactFormDefaults }),
			companies: []
		};
	}

	return {
		form: await superValidate(zod4(crmContactFormSchema), { defaults: crmContactFormDefaults }),
		companies: await listCrmCompaniesForWorkspace(workspace.workspaceId)
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(crmContactFormSchema));

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
			const contact = await createCrmContact({
				workspaceId: workspace.workspaceId,
				data: mapCrmContactFormToCreateInput(form.data)
			});

			throw redirect(303, '/crm/contacts?created=1');
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			return message(form, CRM_CONTACT_CREATE_FAILED_MESSAGE, { status: 500 });
		}
	}
};
