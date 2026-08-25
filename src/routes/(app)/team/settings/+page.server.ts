import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	updateWorkspaceBrandLogoForWeb,
	updateWorkspaceNameForWeb
} from '$lib/server/team/workspace-settings';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canEditTeamSettings } from '$lib/shared/team/member-management';
import { buildSecurityEventRequestContext, recordWorkspaceSecurityEvent } from '$lib/server/security/record-security-event';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';
import { updateWorkspaceNameSchema } from '$lib/shared/schemas/workspace-settings';
import { buildWorkspaceBrandLogoDisplayUrl } from '$lib/shared/workspace-branding';
import {
	WORKSPACE_LOGO_INVALID_TYPE_MESSAGE,
	WORKSPACE_LOGO_NO_CHANGES_MESSAGE,
	WORKSPACE_LOGO_REMOVED_MESSAGE,
	WORKSPACE_LOGO_STORAGE_NOT_CONFIGURED_MESSAGE,
	WORKSPACE_LOGO_TOO_LARGE_MESSAGE,
	WORKSPACE_LOGO_UPDATE_FAILED_MESSAGE,
	WORKSPACE_LOGO_UPDATE_FORBIDDEN_MESSAGE,
	WORKSPACE_LOGO_UPDATED_MESSAGE,
	WORKSPACE_NAME_NO_CHANGES_MESSAGE,
	WORKSPACE_NAME_TAKEN_MESSAGE,
	WORKSPACE_NAME_UPDATE_FAILED_MESSAGE,
	WORKSPACE_NAME_UPDATED_MESSAGE
} from '$lib/shared/team/workspace-settings-messages';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	if (workspace && !canEditTeamSettings(workspace.role)) {
		error(403, 'You do not have permission to manage workspace settings.');
	}

	const nameForm = await superValidate(
		{ name: workspace?.workspaceName ?? '' },
		zod4(updateWorkspaceNameSchema),
		{ id: 'workspaceNameForm' }
	);

	return {
		brandLogoUrl: workspace?.brandLogoUrl ?? null,
		workspaceName: workspace?.workspaceName ?? '',
		nameForm,
		meta: {
			title: 'Workspace settings'
		}
	};
};

export const actions: Actions = {
	updateName: async (event) => {
		const { request, url, locals } = event;
		const form = await superValidate(request, zod4(updateWorkspaceNameSchema), {
			id: 'workspaceNameForm'
		});

		if (!locals.user) {
			return fail(401, { nameForm: form });
		}

		if (!form.valid) {
			return fail(400, { nameForm: form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace) {
			return message(form, WORKSPACE_NAME_UPDATE_FAILED_MESSAGE, { status: 400 });
		}

		if (!canEditTeamSettings(workspace.role)) {
			return message(form, WORKSPACE_LOGO_UPDATE_FORBIDDEN_MESSAGE, { status: 403 });
		}

		const result = await updateWorkspaceNameForWeb({
			workspaceId: workspace.workspaceId,
			actorRole: workspace.role,
			name: form.data.name
		});

		if (!result.ok) {
			if (result.reason === 'FORBIDDEN') {
				return message(form, WORKSPACE_LOGO_UPDATE_FORBIDDEN_MESSAGE, { status: 403 });
			}

			if (result.reason === 'NO_CHANGES') {
				return message(form, WORKSPACE_NAME_NO_CHANGES_MESSAGE, { status: 400 });
			}

			if (result.reason === 'NAME_TAKEN') {
				return message(form, WORKSPACE_NAME_TAKEN_MESSAGE, { status: 400 });
			}

			return message(form, WORKSPACE_NAME_UPDATE_FAILED_MESSAGE, { status: 500 });
		}

		await recordWorkspaceSecurityEvent({
			workspaceId: workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.WORKSPACE_SETTINGS_UPDATED,
			ipAddress: buildSecurityEventRequestContext(event).ipAddress,
			userAgent: buildSecurityEventRequestContext(event).userAgent,
			metadata: {
				detail: `Renamed the workspace to "${result.name}".`,
				field: 'name',
				value: result.name
			}
		});

		return message(form, WORKSPACE_NAME_UPDATED_MESSAGE);
	},

	updateLogo: async (event) => {
		const { request, url, locals } = event;
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

		await recordWorkspaceSecurityEvent({
			workspaceId: workspace.workspaceId,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.WORKSPACE_SETTINGS_UPDATED,
			ipAddress: buildSecurityEventRequestContext(event).ipAddress,
			userAgent: buildSecurityEventRequestContext(event).userAgent,
			metadata: {
				detail: result.removed
					? 'Removed the workspace brand logo.'
					: 'Updated the workspace brand logo.',
				field: 'brandLogo',
				removed: result.removed
			}
		});

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
