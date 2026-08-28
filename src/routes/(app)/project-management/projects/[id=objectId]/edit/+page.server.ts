import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { deletePmClientInvitationsForProject } from '$lib/server/repositories/pm-client-invitations';
import {
	deletePmProjectForWorkspace,
	getPmProjectForWorkspace,
	updatePmProjectForWorkspace
} from '$lib/server/repositories/pm-projects';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageProjectManagement } from '$lib/shared/project-management/access';
import {
	PM_PROJECT_DELETE_FAILED_MESSAGE,
	PM_PROJECT_NOT_FOUND_MESSAGE,
	PM_PROJECT_UPDATE_FAILED_MESSAGE
} from '$lib/shared/project-management/messages';
import {
	mapPmProjectDtoToFormInput,
	mapPmProjectFormToUpdateInput,
	pmProjectFormSchema,
	updatePmProjectSchema
} from '$lib/shared/project-management/schemas';

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
		throw error(404, PM_PROJECT_NOT_FOUND_MESSAGE);
	}

	return {
		project,
		form: await superValidate(zod4(pmProjectFormSchema), {
			defaults: mapPmProjectDtoToFormInput(project)
		})
	};
};

export const actions: Actions = {
	update: async ({ request, url, locals, params }) => {
		const form = await superValidate(request, zod4(pmProjectFormSchema));

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

		const mapped = mapPmProjectFormToUpdateInput(form.data);
		const parsed = updatePmProjectSchema.safeParse(mapped);

		if (!parsed.success) {
			return fail(400, {
				form,
				message: parsed.error.issues[0]?.message ?? 'Invalid project'
			});
		}

		const project = await updatePmProjectForWorkspace({
			workspaceId: workspace.workspaceId,
			projectId: params.id,
			data: parsed.data
		});

		if (!project) {
			return message(form, PM_PROJECT_UPDATE_FAILED_MESSAGE, { status: 404 });
		}

		throw redirect(303, `/project-management/projects/${params.id}?updated=1`);
	},
	delete: async ({ url, locals, params }) => {
		if (!locals.user) {
			error(401, 'Authentication required.');
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			error(403, 'Project Management access required.');
		}

		const project = await getPmProjectForWorkspace({
			workspaceId: workspace.workspaceId,
			projectId: params.id
		});

		if (!project) {
			error(404, PM_PROJECT_NOT_FOUND_MESSAGE);
		}

		await deletePmClientInvitationsForProject({
			workspaceId: workspace.workspaceId,
			projectId: params.id
		});

		const deleted = await deletePmProjectForWorkspace({
			workspaceId: workspace.workspaceId,
			projectId: params.id
		});

		if (!deleted) {
			error(500, PM_PROJECT_DELETE_FAILED_MESSAGE);
		}

		throw redirect(303, '/project-management/projects?deleted=1');
	}
};
