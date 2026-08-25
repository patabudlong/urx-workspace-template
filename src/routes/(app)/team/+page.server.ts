import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { listWorkspaceMembersForDisplay } from '$lib/server/team/workspace-member-directory';
import {
	removeWorkspaceMemberForWeb,
	updateWorkspaceMemberRoleForWeb
} from '$lib/server/team/workspace-member-management';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { removeTeamMemberSchema, updateTeamMemberSchema } from '$lib/shared/schemas/team-invitation';
import {
	TEAM_MEMBER_CANNOT_REMOVE_OWNER_MESSAGE,
	TEAM_MEMBER_CANNOT_UPDATE_OWNER_MESSAGE,
	TEAM_MEMBER_CANNOT_UPDATE_SELF_MESSAGE,
	TEAM_MEMBER_REMOVE_FAILED_MESSAGE,
	TEAM_MEMBER_REMOVE_FORBIDDEN_MESSAGE,
	TEAM_MEMBER_REMOVED_MESSAGE,
	TEAM_MEMBER_UPDATE_FAILED_MESSAGE,
	TEAM_MEMBER_UPDATE_FORBIDDEN_MESSAGE,
	TEAM_MEMBER_UPDATED_MESSAGE
} from '$lib/shared/team/member-messages';
import { canRemoveWorkspaceMembers } from '$lib/shared/team/member-management';
import { buildSecurityEventRequestContext } from '$lib/server/security/record-security-event';
import { ObjectId } from 'mongodb';

export const load: PageServerLoad = async ({ parent, isDataRequest }) => {
	const { workspace } = await parent();

	const membersQuery = workspace
		? listWorkspaceMembersForDisplay(workspace.workspaceId)
		: Promise.resolve([]);

	// Client navigations stream the member list so the route shell paints immediately.
	return {
		members: isDataRequest ? membersQuery : await membersQuery,
		canManageMembers: workspace ? canRemoveWorkspaceMembers(workspace.role) : false,
		meta: {
			title: 'Members'
		}
	};
};

export const actions: Actions = {
	remove: async (event) => {
		const { request, url, locals, getClientAddress } = event;
		const form = await superValidate(request, zod4(removeTeamMemberSchema));

		if (!locals.user) {
			return fail(401, { removeForm: form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace) {
			return fail(400, {
				removeForm: form,
				removeMessage: TEAM_MEMBER_REMOVE_FAILED_MESSAGE
			});
		}

		if (!form.valid) {
			return fail(400, { removeForm: form });
		}

		if (!ObjectId.isValid(form.data.memberId)) {
			return fail(400, {
				removeForm: form,
				removeMessage: TEAM_MEMBER_REMOVE_FAILED_MESSAGE
			});
		}

		const result = await removeWorkspaceMemberForWeb({
			workspaceId: workspace.workspaceId,
			actorRole: workspace.role,
			actorUserId: locals.user.id,
			memberId: form.data.memberId,
			security: buildSecurityEventRequestContext(event)
		});

		if (!result.ok) {
			if (result.reason === 'FORBIDDEN') {
				return fail(403, {
					removeForm: form,
					removeMessage: TEAM_MEMBER_REMOVE_FORBIDDEN_MESSAGE
				});
			}

			if (result.reason === 'OWNER') {
				return fail(400, {
					removeForm: form,
					removeMessage: TEAM_MEMBER_CANNOT_REMOVE_OWNER_MESSAGE
				});
			}

			return fail(404, {
				removeForm: form,
				removeMessage: TEAM_MEMBER_REMOVE_FAILED_MESSAGE
			});
		}

		return {
			removeForm: form,
			removeMessage: TEAM_MEMBER_REMOVED_MESSAGE
		};
	},

	update: async (event) => {
		const { request, url, locals } = event;
		const form = await superValidate(request, zod4(updateTeamMemberSchema));

		if (!locals.user) {
			return fail(401, { updateForm: form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace) {
			return fail(400, {
				updateForm: form,
				updateMessage: TEAM_MEMBER_UPDATE_FAILED_MESSAGE
			});
		}

		if (!form.valid) {
			return fail(400, { updateForm: form });
		}

		if (!ObjectId.isValid(form.data.memberId)) {
			return fail(400, {
				updateForm: form,
				updateMessage: TEAM_MEMBER_UPDATE_FAILED_MESSAGE
			});
		}

		const result = await updateWorkspaceMemberRoleForWeb({
			workspaceId: workspace.workspaceId,
			actorRole: workspace.role,
			actorUserId: locals.user.id,
			memberId: form.data.memberId,
			role: form.data.role,
			security: buildSecurityEventRequestContext(event)
		});

		if (!result.ok) {
			if (result.reason === 'FORBIDDEN') {
				return fail(403, {
					updateForm: form,
					updateMessage: TEAM_MEMBER_UPDATE_FORBIDDEN_MESSAGE
				});
			}

			if (result.reason === 'OWNER') {
				return fail(400, {
					updateForm: form,
					updateMessage: TEAM_MEMBER_CANNOT_UPDATE_OWNER_MESSAGE
				});
			}

			if (result.reason === 'SELF') {
				return fail(400, {
					updateForm: form,
					updateMessage: TEAM_MEMBER_CANNOT_UPDATE_SELF_MESSAGE
				});
			}

			return fail(404, {
				updateForm: form,
				updateMessage: TEAM_MEMBER_UPDATE_FAILED_MESSAGE
			});
		}

		return {
			updateForm: form,
			updateMessage: TEAM_MEMBER_UPDATED_MESSAGE,
			updateChanged: result.changed
		};
	}
};
