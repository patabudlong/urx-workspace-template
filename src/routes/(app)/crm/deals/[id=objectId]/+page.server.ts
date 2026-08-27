import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { getCrmCompanyForWorkspace } from '$lib/server/repositories/crm-companies';
import { getCrmContactForWorkspace } from '$lib/server/repositories/crm-contacts';
import { getCrmDealForWorkspace, updateCrmDealForWorkspace } from '$lib/server/repositories/crm-deals';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageCrm } from '$lib/shared/crm/access';
import { CRM_DEAL_UPDATE_FAILED_MESSAGE, CRM_DEAL_UPDATED_MESSAGE } from '$lib/shared/crm/messages';
import { crmDealStageFormSchema } from '$lib/shared/crm/schemas';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { workspace, canManageCrm: canManage } = await parent();

	if (!workspace || !canManage) {
		throw error(403, 'CRM access required');
	}

	const deal = await getCrmDealForWorkspace({
		workspaceId: workspace.workspaceId,
		dealId: params.id
	});

	if (!deal) {
		throw error(404, 'Deal not found');
	}

	const [contact, company] = await Promise.all([
		deal.contactId
			? getCrmContactForWorkspace({
					workspaceId: workspace.workspaceId,
					contactId: deal.contactId
				})
			: Promise.resolve(null),
		deal.companyId
			? getCrmCompanyForWorkspace({
					workspaceId: workspace.workspaceId,
					companyId: deal.companyId
				})
			: Promise.resolve(null)
	]);

	return {
		deal,
		contact,
		company,
		stageForm: await superValidate(zod4(crmDealStageFormSchema), {
			defaults: { stage: deal.stage }
		})
	};
};

export const actions: Actions = {
	updateStage: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(crmDealStageFormSchema));

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

		const deal = await updateCrmDealForWorkspace({
			workspaceId: workspace.workspaceId,
			dealId: params.id,
			data: { stage: form.data.stage }
		});

		if (!deal) {
			return message(form, CRM_DEAL_UPDATE_FAILED_MESSAGE, { status: 404 });
		}

		return message(form, CRM_DEAL_UPDATED_MESSAGE);
	}
};
