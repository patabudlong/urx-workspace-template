import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { updateWorkspaceModulesForWeb } from '$lib/server/team/workspace-modules';
import {
	filterEnabledPackagesForDeployment,
	listDeployableWorkspacePackages
} from '$lib/server/workspace-packages/installed';
import { isWorkspaceOwner } from '$lib/navigation/app-nav';
import {
	WORKSPACE_MODULES_INVALID_SELECTION_MESSAGE,
	WORKSPACE_MODULES_UPDATE_FAILED_MESSAGE,
	WORKSPACE_MODULES_UPDATE_FORBIDDEN_MESSAGE,
	WORKSPACE_MODULES_UPDATED_MESSAGE
} from '$lib/shared/workspace-modules-messages';
import { workspacePackageIdsSchema } from '$lib/shared/workspace-packages';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	if (!workspace || !isWorkspaceOwner(workspace.role)) {
		error(403, 'Only workspace owners can manage modules.');
	}

	const deployablePackages = await listDeployableWorkspacePackages();
	const enabledPackages = filterEnabledPackagesForDeployment(
		workspace.enabledPackages,
		deployablePackages.map((entry) => entry.id)
	);

	return {
		deployablePackages,
		enabledPackages,
		meta: {
			title: 'Workspace modules'
		}
	};
};

export const actions: Actions = {
	update: async ({ request, url, locals }) => {
		if (!locals.user) {
			return fail(401);
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace) {
			return fail(400, { message: WORKSPACE_MODULES_UPDATE_FAILED_MESSAGE });
		}

		if (!isWorkspaceOwner(workspace.role)) {
			return fail(403, { message: WORKSPACE_MODULES_UPDATE_FORBIDDEN_MESSAGE });
		}

		const formData = await request.formData();
		const enabledPackageValues = formData.getAll('enabledPackages');
		const parsedPackages = workspacePackageIdsSchema.safeParse(
			enabledPackageValues.filter((value): value is string => typeof value === 'string')
		);

		if (!parsedPackages.success) {
			return fail(400, { message: WORKSPACE_MODULES_INVALID_SELECTION_MESSAGE });
		}

		const deployablePackages = await listDeployableWorkspacePackages();
		const enabledPackages = filterEnabledPackagesForDeployment(
			parsedPackages.data,
			deployablePackages.map((entry) => entry.id)
		);

		const result = await updateWorkspaceModulesForWeb({
			workspaceId: workspace.workspaceId,
			actorRole: workspace.role,
			enabledPackages
		});

		if (!result.ok) {
			if (result.reason === 'FORBIDDEN') {
				return fail(403, { message: WORKSPACE_MODULES_UPDATE_FORBIDDEN_MESSAGE });
			}

			return fail(400, { message: WORKSPACE_MODULES_UPDATE_FAILED_MESSAGE });
		}

		return {
			message: WORKSPACE_MODULES_UPDATED_MESSAGE,
			enabledPackages: result.enabledPackages
		};
	}
};
