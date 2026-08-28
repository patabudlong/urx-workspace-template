import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { findUserById } from '$lib/server/repositories/users';
import {
	listPmClientOnboardingInvitesForProject,
	sendPmClientOnboardingInvite
} from '$lib/server/project-management/client-onboarding';
import {
	addPmDocumentChecklistItem,
	listPmDocumentChecklistForProject,
	listPmDocumentFilesForChecklistItem,
	listPmDocumentPortalInvitesForProject,
	removePmDocumentChecklistItem,
	reviewPmDocumentChecklistItem,
	sendPmDocumentPortalInvite,
	sendPmDocumentPortalReminder
} from '$lib/server/project-management/document-portal';
import {
	addPmProjectComment,
	addPmProjectMilestone,
	listPmProjectActivityForProject,
	listPmProjectMilestonesForProject,
	removePmProjectMilestone,
	setPmProjectMilestoneStatus
} from '$lib/server/project-management/delivery';
import { listWorkspaceMembersForDisplay } from '$lib/server/team/workspace-member-directory';
import { isCrmActiveForWorkspace } from '$lib/server/crm/integration';
import { getPmProjectForWorkspace, updatePmProjectForWorkspace } from '$lib/server/repositories/pm-projects';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageProjectManagement } from '$lib/shared/project-management/access';
import {
	PM_CLIENT_INVITE_FAILED_MESSAGE,
	PM_CLIENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE,
	PM_CLIENT_INVITE_SENT_MESSAGE,
	PM_DOCUMENT_CHECKLIST_ITEM_ADD_FAILED_MESSAGE,
	PM_ACTIVITY_COMMENT_ADDED_MESSAGE,
	PM_ACTIVITY_COMMENT_FAILED_MESSAGE,
	PM_DOCUMENT_CHECKLIST_ITEM_ADDED_MESSAGE,
	PM_DOCUMENT_CHECKLIST_ITEM_REMOVE_FAILED_MESSAGE,
	PM_DOCUMENT_CHECKLIST_ITEM_REMOVED_MESSAGE,
	PM_DOCUMENT_CHECKLIST_ITEM_REVIEW_FAILED_MESSAGE,
	PM_DOCUMENT_CHECKLIST_ITEM_REVIEWED_MESSAGE,
	PM_DOCUMENT_INVITE_FAILED_MESSAGE,
	PM_DOCUMENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE,
	PM_DOCUMENT_INVITE_SENT_MESSAGE,
	PM_DOCUMENT_REMINDER_FAILED_MESSAGE,
	PM_DOCUMENT_REMINDER_SENT_MESSAGE,
	PM_MILESTONE_ADD_FAILED_MESSAGE,
	PM_MILESTONE_ADDED_MESSAGE,
	PM_MILESTONE_REMOVE_FAILED_MESSAGE,
	PM_MILESTONE_REMOVED_MESSAGE,
	PM_MILESTONE_UPDATE_FAILED_MESSAGE,
	PM_MILESTONE_UPDATED_MESSAGE,
	PM_PROJECT_UPDATE_FAILED_MESSAGE,
	PM_PROJECT_UPDATED_MESSAGE
} from '$lib/shared/project-management/messages';
import {
	pmClientInviteFormDefaults,
	pmClientInviteFormSchema,
	pmDocumentChecklistItemFormDefaults,
	pmDocumentChecklistItemFormSchema,
	pmDocumentReviewFormSchema,
	pmActivityCommentFormSchema,
	pmMilestoneFormDefaults,
	pmMilestoneFormSchema,
	pmMilestoneStatusFormSchema,
	pmProjectStatusFormSchema
} from '$lib/shared/project-management/schemas';
import { buildUserDisplay } from '$lib/shared/user-display';
import { z } from 'zod';

async function resolveInviterName(userId: string): Promise<string> {
	const user = await findUserById(userId);
	if (!user) {
		return 'Your project team';
	}

	return (
		buildUserDisplay({
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			avatarUrl: user.avatarUrl ?? null
		}).fullName.trim() || 'Your project team'
	);
}

export const load: PageServerLoad = async ({ parent, params }) => {
	const { workspace, canManageProjectManagement: canManage } = await parent();

	if (!workspace || !canManage) {
		throw error(403, 'Project Management access required');
	}

	const project = await getPmProjectForWorkspace({
		workspaceId: workspace.workspaceId,
		projectId: params.id
	});

	if (!project) {
		throw error(404, 'Project not found');
	}

	const [invitations, checklistItems, documentInvitations, milestones, activity, workspaceMembers, crmActive] =
		await Promise.all([
		listPmClientOnboardingInvitesForProject({
			workspaceId: workspace.workspaceId,
			projectId: params.id
		}),
		listPmDocumentChecklistForProject({
			workspaceId: workspace.workspaceId,
			projectId: params.id
		}),
		listPmDocumentPortalInvitesForProject({
			workspaceId: workspace.workspaceId,
			projectId: params.id
		}),
		listPmProjectMilestonesForProject({
			workspaceId: workspace.workspaceId,
			projectId: params.id
		}),
		listPmProjectActivityForProject({
			workspaceId: workspace.workspaceId,
			projectId: params.id
		}),
		listWorkspaceMembersForDisplay(workspace.workspaceId),
		isCrmActiveForWorkspace(workspace.workspaceId)
	]);

	const filesByItemEntries = await Promise.all(
		checklistItems.map(async (item) => {
			const files = await listPmDocumentFilesForChecklistItem({
				workspaceId: workspace.workspaceId,
				projectId: params.id,
				checklistItemId: item.id
			});

			return [item.id, files] as const;
		})
	);

	const filesByItem = Object.fromEntries(filesByItemEntries);

	const assignee = project.assignedMemberId
		? (workspaceMembers.find((member) => member.id === project.assignedMemberId) ?? null)
		: null;

	return {
		project,
		invitations,
		checklistItems,
		documentInvitations,
		filesByItem,
		milestones,
		activity,
		assignee,
		crmActive,
		statusForm: await superValidate(zod4(pmProjectStatusFormSchema), {
			defaults: { status: project.status }
		}),
		inviteForm: await superValidate(zod4(pmClientInviteFormSchema), {
			defaults: {
				...pmClientInviteFormDefaults,
				clientName: project.clientName ?? ''
			}
		}),
		documentInviteForm: await superValidate(zod4(pmClientInviteFormSchema), {
			defaults: {
				...pmClientInviteFormDefaults,
				clientName: project.clientName ?? ''
			}
		}),
		checklistForm: await superValidate(zod4(pmDocumentChecklistItemFormSchema), {
			defaults: pmDocumentChecklistItemFormDefaults
		}),
		milestoneForm: await superValidate(zod4(pmMilestoneFormSchema), {
			defaults: pmMilestoneFormDefaults
		}),
		activityCommentForm: await superValidate(zod4(pmActivityCommentFormSchema), {
			defaults: { body: '' }
		})
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmProjectStatusFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const project = await updatePmProjectForWorkspace({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			data: { status: form.data.status }
		});

		if (!project) {
			return message(form, PM_PROJECT_UPDATE_FAILED_MESSAGE, { status: 404 });
		}

		return message(form, PM_PROJECT_UPDATED_MESSAGE);
	},
	sendInvite: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmClientInviteFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const inviterName = await resolveInviterName(locals.user.id);

		const result = await sendPmClientOnboardingInvite({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			invitedByUserId: locals.user.id,
			inviterName,
			clientEmail: form.data.clientEmail,
			clientName:
				form.data.clientName && form.data.clientName.trim().length > 0
					? form.data.clientName.trim()
					: null,
			origin: url.origin
		});

		if (!result.ok) {
			if (result.reason === 'MAIL_NOT_CONFIGURED') {
				return fail(503, { form, message: PM_CLIENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE });
			}

			return fail(500, { form, message: PM_CLIENT_INVITE_FAILED_MESSAGE });
		}

		return message(form, PM_CLIENT_INVITE_SENT_MESSAGE);
	},
	sendDocumentInvite: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmClientInviteFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const inviterName = await resolveInviterName(locals.user.id);

		const result = await sendPmDocumentPortalInvite({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			invitedByUserId: locals.user.id,
			inviterName,
			clientEmail: form.data.clientEmail,
			clientName:
				form.data.clientName && form.data.clientName.trim().length > 0
					? form.data.clientName.trim()
					: null,
			origin: url.origin
		});

		if (!result.ok) {
			if (result.reason === 'MAIL_NOT_CONFIGURED') {
				return fail(503, { form, message: PM_DOCUMENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE });
			}

			return fail(500, { form, message: PM_DOCUMENT_INVITE_FAILED_MESSAGE });
		}

		return message(form, PM_DOCUMENT_INVITE_SENT_MESSAGE);
	},
	sendDocumentReminder: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmClientInviteFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const inviterName = await resolveInviterName(locals.user.id);

		const result = await sendPmDocumentPortalReminder({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			invitedByUserId: locals.user.id,
			inviterName,
			clientEmail: form.data.clientEmail,
			clientName:
				form.data.clientName && form.data.clientName.trim().length > 0
					? form.data.clientName.trim()
					: null,
			origin: url.origin
		});

		if (!result.ok) {
			if (result.reason === 'MAIL_NOT_CONFIGURED') {
				return fail(503, { form, message: PM_DOCUMENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE });
			}

			return fail(500, { form, message: PM_DOCUMENT_REMINDER_FAILED_MESSAGE });
		}

		return message(form, PM_DOCUMENT_REMINDER_SENT_MESSAGE);
	},
	addChecklistItem: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmDocumentChecklistItemFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const item = await addPmDocumentChecklistItem({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			title: form.data.title,
			description:
				form.data.description && form.data.description.length > 0 ? form.data.description : null,
			required: form.data.required
		});

		if (!item) {
			return message(form, PM_DOCUMENT_CHECKLIST_ITEM_ADD_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PM_DOCUMENT_CHECKLIST_ITEM_ADDED_MESSAGE);
	},
	removeChecklistItem: async ({ request, url, locals, params }) => {
		const form = await superValidate(
			request,
			zod4(z.object({ itemId: z.string().trim().min(1) }))
		);

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const removed = await removePmDocumentChecklistItem({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			itemId: form.data.itemId
		});

		if (!removed) {
			return message(form, PM_DOCUMENT_CHECKLIST_ITEM_REMOVE_FAILED_MESSAGE, { status: 404 });
		}

		return message(form, PM_DOCUMENT_CHECKLIST_ITEM_REMOVED_MESSAGE);
	},
	reviewChecklistItem: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmDocumentReviewFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const item = await reviewPmDocumentChecklistItem({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			itemId: form.data.itemId,
			status: form.data.status,
			reviewedByUserId: locals.user.id
		});

		if (!item) {
			return message(form, PM_DOCUMENT_CHECKLIST_ITEM_REVIEW_FAILED_MESSAGE, { status: 404 });
		}

		return message(form, PM_DOCUMENT_CHECKLIST_ITEM_REVIEWED_MESSAGE);
	},
	addMilestone: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmMilestoneFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const milestone = await addPmProjectMilestone({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			title: form.data.title,
			description:
				form.data.description && form.data.description.length > 0 ? form.data.description : null,
			actorUserId: locals.user.id
		});

		if (!milestone) {
			return message(form, PM_MILESTONE_ADD_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PM_MILESTONE_ADDED_MESSAGE);
	},
	updateMilestoneStatus: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmMilestoneStatusFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const milestone = await setPmProjectMilestoneStatus({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			milestoneId: form.data.milestoneId,
			status: form.data.status,
			actorUserId: locals.user.id
		});

		if (!milestone) {
			return message(form, PM_MILESTONE_UPDATE_FAILED_MESSAGE, { status: 404 });
		}

		return message(form, PM_MILESTONE_UPDATED_MESSAGE);
	},
	removeMilestone: async ({ request, url, locals, params }) => {
		const form = await superValidate(
			request,
			zod4(z.object({ milestoneId: z.string().trim().min(1) }))
		);

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const removed = await removePmProjectMilestone({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			milestoneId: form.data.milestoneId
		});

		if (!removed) {
			return message(form, PM_MILESTONE_REMOVE_FAILED_MESSAGE, { status: 404 });
		}

		return message(form, PM_MILESTONE_REMOVED_MESSAGE);
	},
	addActivityComment: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmActivityCommentFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { form, message: 'Project Management access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		await addPmProjectComment({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			body: form.data.body,
			actorUserId: locals.user.id
		});

		return message(form, PM_ACTIVITY_COMMENT_ADDED_MESSAGE);
	}
};
