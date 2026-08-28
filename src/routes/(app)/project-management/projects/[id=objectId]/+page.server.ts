import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { findUserById } from '$lib/server/repositories/users';
import {
	listPmClientOnboardingInvitesForProject,
	sendPmClientOnboardingInvite
} from '$lib/server/project-management/client-onboarding';
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
	PM_PROJECT_UPDATE_FAILED_MESSAGE,
	PM_PROJECT_UPDATED_MESSAGE
} from '$lib/shared/project-management/messages';
import {
	pmClientInviteFormDefaults,
	pmClientInviteFormSchema,
	pmProjectStatusFormSchema
} from '$lib/shared/project-management/schemas';
import { buildUserDisplay } from '$lib/shared/user-display';

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

	const invitations = await listPmClientOnboardingInvitesForProject({
		workspaceId: workspace.workspaceId,
		projectId: params.id
	});

	return {
		project,
		invitations,
		statusForm: await superValidate(zod4(pmProjectStatusFormSchema), {
			defaults: { status: project.status }
		}),
		inviteForm: await superValidate(zod4(pmClientInviteFormSchema), {
			defaults: {
				...pmClientInviteFormDefaults,
				clientName: project.clientName ?? ''
			}
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

		const user = await findUserById(locals.user.id);
		const inviterName = user
			? buildUserDisplay({
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					avatarUrl: user.avatarUrl ?? null
				}).fullName.trim() || 'Your project team'
			: 'Your project team';

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
	}
};
