import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { listWorkspaceMembersForDisplay } from '$lib/server/team/workspace-member-directory';
import { removeWorkspaceMemberForWeb } from '$lib/server/team/workspace-member-management';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { removeTeamMemberSchema } from '$lib/shared/schemas/team-invitation';
import {
	TEAM_MEMBER_CANNOT_REMOVE_OWNER_MESSAGE,
	TEAM_MEMBER_REMOVE_FAILED_MESSAGE,
	TEAM_MEMBER_REMOVE_FORBIDDEN_MESSAGE,
	TEAM_MEMBER_REMOVED_MESSAGE
} from '$lib/shared/team/member-messages';
import { canRemoveWorkspaceMembers } from '$lib/shared/team/member-management';
import { ObjectId } from 'mongodb';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	const members = workspace
		? await listWorkspaceMembersForDisplay(workspace.workspaceId)
		: [];

	return {
		members,
		canManageMembers: workspace ? canRemoveWorkspaceMembers(workspace.role) : false,
		meta: {
			title: 'Members'
		}
	};
};

export const actions: Actions = {
	remove: async ({ request, url, locals }) => {
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
			memberId: form.data.memberId
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
	}
};
