import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { createPmProject } from '$lib/server/repositories/pm-projects';
import { listWorkspaceMembersForDisplay } from '$lib/server/team/workspace-member-directory';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageProjectManagement } from '$lib/shared/project-management/access';
import { PM_PROJECT_CREATE_FAILED_MESSAGE } from '$lib/shared/project-management/messages';
import {
	createPmProjectSchema,
	mapPmProjectFormToCreateInput,
	pmProjectFormDefaults,
	pmProjectFormSchema
} from '$lib/shared/project-management/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();
	const members = workspace
		? await listWorkspaceMembersForDisplay(workspace.workspaceId)
		: [];

	return {
		members,
		form: await superValidate(zod4(pmProjectFormSchema), { defaults: pmProjectFormDefaults })
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
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

		const mapped = mapPmProjectFormToCreateInput(form.data);
		const parsed = createPmProjectSchema.safeParse(mapped);

		if (!parsed.success) {
			return fail(400, {
				form,
				message: parsed.error.issues[0]?.message ?? 'Invalid project'
			});
		}

		try {
			const project = await createPmProject({
				workspaceId: workspace.workspaceId,
				data: parsed.data
			});

			throw redirect(303, `/project-management/projects/${project.id}`);
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			return message(form, PM_PROJECT_CREATE_FAILED_MESSAGE, { status: 500 });
		}
	}
};
