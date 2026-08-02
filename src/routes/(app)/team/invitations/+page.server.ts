import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { listPendingWorkspaceInvitations, ensureWorkspaceInvitationIndexes } from '$lib/server/repositories/workspace-invitations';
import { consumeTeamInvitationFormRateLimit } from '$lib/server/security/team-invitation-rate-limit';
import { queueTeamInvitationForWeb } from '$lib/server/team/workspace-invitations';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { loadUserDisplay } from '$lib/server/user-display';
import {
	teamInvitationDefaults,
	teamInvitationSchema
} from '$lib/shared/schemas/team-invitation';
import {
	TEAM_INVITATION_MAIL_NOT_CONFIGURED_MESSAGE,
	TEAM_INVITATION_NO_WORKSPACE_MESSAGE,
	TEAM_INVITATION_RATE_LIMIT_MESSAGE,
	TEAM_INVITATION_SEND_FAILED_MESSAGE,
	TEAM_INVITATION_SENT_MESSAGE
} from '$lib/shared/team/invitation-messages';
import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();
	const form = await superValidate(zod4(teamInvitationSchema), {
		defaults: teamInvitationDefaults
	});

	const pendingInvitations = workspace
		? await (async () => {
				await ensureWorkspaceInvitationIndexes();

				return (await listPendingWorkspaceInvitations(workspace.workspaceId)).map((invitation) => ({
				id: invitation._id.toString(),
				email: invitation.invitedEmail,
				role: invitation.role,
				roleLabel: findTeamInviteRoleOption(invitation.role)?.label ?? invitation.role,
				createdAt: invitation.createdAt.toISOString()
			}));
			})()
		: [];

	return {
		form,
		pendingInvitations,
		meta: {
			title: 'Invitations'
		}
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals, getClientAddress }) => {
		const form = await superValidate(request, zod4(teamInvitationSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());
		const userDisplay = await loadUserDisplay(locals.user.id, locals.user.email);

		if (!workspace) {
			return message(form, TEAM_INVITATION_NO_WORKSPACE_MESSAGE, { status: 400 });
		}

		const rateLimited = consumeTeamInvitationFormRateLimit({
			clientIp: getClientAddress()
		});

		if (!rateLimited.ok) {
			return message(form, TEAM_INVITATION_RATE_LIMIT_MESSAGE, { status: 429 });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const inviterName = userDisplay.fullName.trim() || 'A teammate';

		const result = await queueTeamInvitationForWeb(
			{ platform: undefined },
			{
				workspaceId: workspace.workspaceId,
				invitedByUserId: locals.user!.id,
				inviterName,
				inviterEmail: locals.user!.email,
				data: form.data,
				origin: url.origin
			}
		);

		if (!result.ok) {
			if (result.reason === 'MAIL_NOT_CONFIGURED') {
				return message(form, TEAM_INVITATION_MAIL_NOT_CONFIGURED_MESSAGE, { status: 503 });
			}

			if (result.reason === 'WORKSPACE_NOT_FOUND') {
				return message(form, TEAM_INVITATION_NO_WORKSPACE_MESSAGE, { status: 400 });
			}

			if (result.reason === 'SEND_FAILED') {
				return message(form, TEAM_INVITATION_SEND_FAILED_MESSAGE, { status: 503 });
			}

			if (result.reason === 'THROTTLED') {
				return message(form, TEAM_INVITATION_RATE_LIMIT_MESSAGE, { status: 429 });
			}

			if (
				result.reason === 'DUPLICATE_PENDING' ||
				result.reason === 'ALREADY_MEMBER' ||
				result.reason === 'SELF_INVITE'
			) {
				return message(form, result.message, { status: 400 });
			}
		}

		return message(form, TEAM_INVITATION_SENT_MESSAGE);
	}
};
