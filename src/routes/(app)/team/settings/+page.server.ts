import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { updateWorkspaceBrandLogoForWeb } from '$lib/server/team/workspace-settings';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canEditTeamSettings } from '$lib/shared/team/member-management';
import { buildWorkspaceBrandLogoDisplayUrl } from '$lib/shared/workspace-branding';
import {
	WORKSPACE_LOGO_INVALID_TYPE_MESSAGE,
	WORKSPACE_LOGO_NO_CHANGES_MESSAGE,
	WORKSPACE_LOGO_REMOVED_MESSAGE,
	WORKSPACE_LOGO_STORAGE_NOT_CONFIGURED_MESSAGE,
	WORKSPACE_LOGO_TOO_LARGE_MESSAGE,
	WORKSPACE_LOGO_UPDATE_FAILED_MESSAGE,
	WORKSPACE_LOGO_UPDATE_FORBIDDEN_MESSAGE,
	WORKSPACE_LOGO_UPDATED_MESSAGE
} from '$lib/shared/team/workspace-settings-messages';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	if (workspace && !canEditTeamSettings(workspace.role)) {
		error(403, 'You do not have permission to manage workspace settings.');
	}

	return {
		brandLogoUrl: workspace?.brandLogoUrl ?? null,
		workspaceName: workspace?.workspaceName ?? '',
		meta: {
			title: 'Workspace settings'
		}
	};
};

export const actions: Actions = {
	updateLogo: async ({ request, url, locals }) => {
		if (!locals.user) {
			return fail(401);
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace) {
			return fail(400, { message: WORKSPACE_LOGO_UPDATE_FAILED_MESSAGE });
		}

		if (!canEditTeamSettings(workspace.role)) {
			return fail(403, { message: WORKSPACE_LOGO_UPDATE_FORBIDDEN_MESSAGE });
		}

		const formData = await request.formData();
		const removeLogo = formData.get('removeLogo') === 'true';
		const brandLogoEntry = formData.get('brandLogo');
		const brandLogo =
			brandLogoEntry instanceof File && brandLogoEntry.size > 0 ? brandLogoEntry : undefined;

		const result = await updateWorkspaceBrandLogoForWeb({
			workspaceId: workspace.workspaceId,
			workspaceSlug: workspace.workspaceSlug,
			actorRole: workspace.role,
			brandLogo,
			removeLogo
		});

		if (!result.ok) {
			if (result.reason === 'FORBIDDEN') {
				return fail(403, { message: WORKSPACE_LOGO_UPDATE_FORBIDDEN_MESSAGE });
			}

			if (result.reason === 'NO_CHANGES') {
				return fail(400, { message: WORKSPACE_LOGO_NO_CHANGES_MESSAGE });
			}

			if (result.reason === 'INVALID_TYPE') {
				return fail(400, { message: WORKSPACE_LOGO_INVALID_TYPE_MESSAGE });
			}

			if (result.reason === 'FILE_TOO_LARGE') {
				return fail(400, { message: WORKSPACE_LOGO_TOO_LARGE_MESSAGE });
			}

			if (result.reason === 'STORAGE_NOT_CONFIGURED') {
				return fail(503, { message: WORKSPACE_LOGO_STORAGE_NOT_CONFIGURED_MESSAGE });
			}

			return fail(500, { message: WORKSPACE_LOGO_UPDATE_FAILED_MESSAGE });
		}

		return {
			message: result.removed ? WORKSPACE_LOGO_REMOVED_MESSAGE : WORKSPACE_LOGO_UPDATED_MESSAGE,
			brandLogoUrl: result.removed
				? null
				: buildWorkspaceBrandLogoDisplayUrl({
						slug: workspace.workspaceSlug,
						brandLogoUrl: result.brandLogoUrl,
						updatedAt: Date.now()
					})
		};
	}
};
