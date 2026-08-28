import { isProjectManagementActiveForWorkspace } from '$lib/server/project-management/integration';
import {
	createPmProject,
	findPmProjectByCrmDealId,
	logPmProjectActivity
} from '$lib/server/repositories/pm-projects';
import { PM_PROJECT_TYPES } from '$lib/shared/project-management/project-types';
import { PM_PROJECT_STATUSES } from '$lib/shared/models/pm-project';
import { PM_PROJECT_ACTIVITY_TYPES } from '$lib/shared/models/pm-project-activity';

export type CreatePmProjectFromCrmDealInput = {
	workspaceId: string;
	dealId: string;
	title: string;
	companyId: string | null;
	contactId: string | null;
	clientName: string | null;
	expectedCloseDate: string | null;
	notes: string | null;
	createdByUserId: string;
};

export type CreatePmProjectFromCrmDealResult =
	| { ok: true; projectId: string; created: boolean }
	| { ok: false; reason: 'PM_NOT_ACTIVE' | 'CREATE_FAILED' };

export async function createPmProjectFromCrmDeal(
	input: CreatePmProjectFromCrmDealInput
): Promise<CreatePmProjectFromCrmDealResult> {
	if (!(await isProjectManagementActiveForWorkspace(input.workspaceId))) {
		return { ok: false, reason: 'PM_NOT_ACTIVE' };
	}

	const existing = await findPmProjectByCrmDealId({
		workspaceId: input.workspaceId,
		crmDealId: input.dealId
	});

	if (existing) {
		return { ok: true, projectId: existing.id, created: false };
	}

	try {
		const project = await createPmProject({
			workspaceId: input.workspaceId,
			data: {
				title: input.title,
				description: input.notes,
				status: PM_PROJECT_STATUSES.PLANNING,
				clientName: input.clientName,
				projectTypes: [PM_PROJECT_TYPES.PROJECT],
				projectUrl: null,
				crmCompanyId: input.companyId,
				crmContactId: input.contactId,
				crmDealId: input.dealId,
				assignedMemberId: null,
				dueDate: input.expectedCloseDate,
				notes: input.notes
					? `Created from CRM deal.\n\n${input.notes}`
					: 'Created from CRM deal.'
			}
		});

		await logPmProjectActivity({
			workspaceId: input.workspaceId,
			projectId: project.id,
			type: PM_PROJECT_ACTIVITY_TYPES.CREATED,
			body: 'Project created from CRM deal.',
			actorUserId: input.createdByUserId
		});

		return { ok: true, projectId: project.id, created: true };
	} catch {
		return { ok: false, reason: 'CREATE_FAILED' };
	}
}

export async function getPmProjectIdForCrmDeal(input: {
	workspaceId: string;
	crmDealId: string;
}): Promise<string | null> {
	if (!(await isProjectManagementActiveForWorkspace(input.workspaceId))) {
		return null;
	}

	const project = await findPmProjectByCrmDealId(input);
	return project?.id ?? null;
}
