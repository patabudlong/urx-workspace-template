import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getCrmCompanyForWorkspace } from '$lib/server/repositories/crm-companies';
import { getCrmContactForWorkspace } from '$lib/server/repositories/crm-contacts';
import { getCrmDealForWorkspace, updateCrmDealForWorkspace } from '$lib/server/repositories/crm-deals';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import {
	isCrmProjectHandoffAvailable,
	loadCrmProjectHandoffModule
} from '$lib/server/workspace-integrations/crm-project-management';
import { canManageCrm } from '$lib/shared/crm/access';
import {
	CRM_DEAL_PROJECT_CREATE_FAILED_MESSAGE,
	CRM_DEAL_PROJECT_CREATED_MESSAGE,
	CRM_DEAL_PROJECT_HANDOFF_UNAVAILABLE_MESSAGE,
	CRM_DEAL_PROJECT_LINKED_MESSAGE,
	CRM_DEAL_UPDATE_FAILED_MESSAGE,
	CRM_DEAL_UPDATED_MESSAGE
} from '$lib/shared/crm/messages';
import { CRM_DEAL_STAGES } from '$lib/shared/models/crm-deal';
import { crmDealStageFormSchema } from '$lib/shared/crm/schemas';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

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

	const [contact, company, projectHandoffAvailable] = await Promise.all([
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
			: Promise.resolve(null),
		isCrmProjectHandoffAvailable()
	]);

	let linkedProjectId: string | null = null;
	if (projectHandoffAvailable) {
		const handoff = await loadCrmProjectHandoffModule();
		linkedProjectId = handoff
			? await handoff.getPmProjectIdForCrmDeal({
					workspaceId: workspace.workspaceId,
					crmDealId: deal.id
				})
			: null;
	}

	return {
		deal,
		contact,
		company,
		projectHandoffAvailable,
		linkedProjectId,
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
	},
	createProject: async ({ url, locals, params }) => {
		if (!locals.user) {
			error(401, 'Authentication required.');
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageCrm(workspace.role)) {
			error(403, 'CRM access required.');
		}

		const handoff = await loadCrmProjectHandoffModule();
		if (!handoff) {
			error(503, CRM_DEAL_PROJECT_HANDOFF_UNAVAILABLE_MESSAGE);
		}

		const deal = await getCrmDealForWorkspace({
			workspaceId: workspace.workspaceId,
			dealId: params.id
		});

		if (!deal) {
			error(404, 'Deal not found');
		}

		if (deal.stage !== CRM_DEAL_STAGES.WON) {
			error(400, 'Only won deals can be converted to projects.');
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

		const clientName =
			company?.name ??
			(contact ? `${contact.firstName} ${contact.lastName}`.trim() : null) ??
			null;

		const result = await handoff.createPmProjectFromCrmDeal({
			workspaceId: workspace.workspaceId,
			dealId: deal.id,
			title: deal.title,
			companyId: deal.companyId,
			contactId: deal.contactId,
			clientName,
			expectedCloseDate: deal.expectedCloseDate,
			notes: deal.notes,
			createdByUserId: locals.user.id
		});

		if (!result.ok) {
			if (result.reason === 'PM_NOT_ACTIVE') {
				error(503, CRM_DEAL_PROJECT_HANDOFF_UNAVAILABLE_MESSAGE);
			}

			error(500, CRM_DEAL_PROJECT_CREATE_FAILED_MESSAGE);
		}

		if (!result.created) {
			throw redirect(303, `/project-management/projects/${result.projectId}`);
		}

		throw redirect(
			303,
			`/project-management/projects/${result.projectId}?fromCrmDeal=1`
		);
	}
};
