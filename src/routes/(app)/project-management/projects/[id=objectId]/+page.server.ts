import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { getPmProjectForWorkspace, updatePmProjectForWorkspace } from '$lib/server/repositories/pm-projects';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageProjectManagement } from '$lib/shared/project-management/access';
import {
	PM_PROJECT_UPDATE_FAILED_MESSAGE,
	PM_PROJECT_UPDATED_MESSAGE
} from '$lib/shared/project-management/messages';
import { pmProjectStatusFormSchema } from '$lib/shared/project-management/schemas';

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

	return {
		project,
		statusForm: await superValidate(zod4(pmProjectStatusFormSchema), {
			defaults: { status: project.status }
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
	}
};
