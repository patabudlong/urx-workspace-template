import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { createCrmDeal } from '$lib/server/repositories/crm-deals';
import { listCrmCompaniesForWorkspace } from '$lib/server/repositories/crm-companies';
import { listCrmContactsForWorkspace } from '$lib/server/repositories/crm-contacts';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageCrm } from '$lib/shared/crm/access';
import { CRM_DEAL_CREATE_FAILED_MESSAGE } from '$lib/shared/crm/messages';
import {
	crmDealFormDefaults,
	crmDealFormSchema,
	createCrmDealSchema,
	mapCrmDealFormToCreateInput
} from '$lib/shared/crm/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageCrm: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(crmDealFormSchema), { defaults: crmDealFormDefaults }),
			contacts: [],
			companies: []
		};
	}

	const [contacts, companies] = await Promise.all([
		listCrmContactsForWorkspace(workspace.workspaceId),
		listCrmCompaniesForWorkspace(workspace.workspaceId)
	]);

	return {
		form: await superValidate(zod4(crmDealFormSchema), { defaults: crmDealFormDefaults }),
		contacts,
		companies
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(crmDealFormSchema));

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

		const mapped = mapCrmDealFormToCreateInput(form.data);
		const parsed = createCrmDealSchema.safeParse(mapped);

		if (!parsed.success) {
			return fail(400, {
				form,
				message: parsed.error.issues[0]?.message ?? 'Invalid deal'
			});
		}

		try {
			const deal = await createCrmDeal({
				workspaceId: workspace.workspaceId,
				data: parsed.data
			});

			throw redirect(303, `/crm/deals/${deal.id}`);
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			return message(form, CRM_DEAL_CREATE_FAILED_MESSAGE, { status: 500 });
		}
	}
};
