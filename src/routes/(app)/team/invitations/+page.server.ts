import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	ensureWorkspaceInvitationIndexes,
	listPendingWorkspaceInvitations,
	revokeWorkspaceInvitation
} from '$lib/server/repositories/workspace-invitations';
import { findUserByEmail } from '$lib/server/repositories/users';
import { consumeTeamInvitationFormRateLimit } from '$lib/server/security/team-invitation-rate-limit';
import {
	queueTeamInvitationForWeb,
	resendWorkspaceInvitationForWeb
} from '$lib/server/team/workspace-invitations';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { loadUserDisplay } from '$lib/server/user-display';
import {
	cancelTeamInvitationSchema,
	teamInvitationDefaults,
	teamInvitationSchema
} from '$lib/shared/schemas/team-invitation';
	import {
		TEAM_INVITATION_CANCEL_FAILED_MESSAGE,
		TEAM_INVITATION_CANCELLED_MESSAGE,
		TEAM_INVITATION_MAIL_NOT_CONFIGURED_MESSAGE,
		TEAM_INVITATION_NO_WORKSPACE_MESSAGE,
		TEAM_INVITATION_RATE_LIMIT_MESSAGE,
		TEAM_INVITATION_RESEND_FAILED_MESSAGE,
		TEAM_INVITATION_RESENT_MESSAGE,
		TEAM_INVITATION_SEND_FAILED_MESSAGE,
		TEAM_INVITATION_SENT_EXISTING_ACCOUNT_MESSAGE,
		TEAM_INVITATION_SENT_MESSAGE
	} from '$lib/shared/team/invitation-messages';
import { canInviteWorkspaceMembers } from '$lib/shared/team/member-management';
import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';
import { ObjectId } from 'mongodb';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	if (workspace && !canInviteWorkspaceMembers(workspace.role)) {
		error(403, 'You do not have permission to manage invitations.');
	}

	const form = await superValidate(zod4(teamInvitationSchema), {
		defaults: teamInvitationDefaults
	});

	const pendingInvitations = workspace
		? await (async () => {
				await ensureWorkspaceInvitationIndexes();

				const invitations = await listPendingWorkspaceInvitations(workspace.workspaceId);

				return Promise.all(
					invitations.map(async (invitation) => ({
						id: invitation._id.toString(),
						email: invitation.invitedEmail,
						role: invitation.role,
						roleLabel: findTeamInviteRoleOption(invitation.role)?.label ?? invitation.role,
						createdAt: invitation.createdAt.toISOString(),
						expiresAt: invitation.expiresAt.toISOString(),
						hasAccount: Boolean(await findUserByEmail(invitation.invitedEmail))
					}))
				);
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
	send: async ({ request, url, locals, getClientAddress }) => {
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

		if (!canInviteWorkspaceMembers(workspace.role)) {
			return message(form, TEAM_INVITATION_NO_WORKSPACE_MESSAGE, { status: 403 });
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

		return message(
			form,
			result.inviteeHasAccount
				? TEAM_INVITATION_SENT_EXISTING_ACCOUNT_MESSAGE
				: TEAM_INVITATION_SENT_MESSAGE
		);
	},
	resend: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(cancelTeamInvitationSchema));

		if (!locals.user) {
			return fail(401, { resendForm: form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());
		const userDisplay = await loadUserDisplay(locals.user.id, locals.user.email);

		if (!workspace) {
			return fail(400, {
				resendForm: form,
				resendMessage: TEAM_INVITATION_NO_WORKSPACE_MESSAGE
			});
		}

		if (!canInviteWorkspaceMembers(workspace.role)) {
			return fail(403, {
				resendForm: form,
				resendMessage: TEAM_INVITATION_NO_WORKSPACE_MESSAGE
			});
		}

		if (!form.valid || !ObjectId.isValid(form.data.invitationId)) {
			return fail(400, {
				resendForm: form,
				resendMessage: TEAM_INVITATION_RESEND_FAILED_MESSAGE
			});
		}

		const result = await resendWorkspaceInvitationForWeb({
			workspaceId: workspace.workspaceId,
			invitationId: form.data.invitationId,
			inviterName: userDisplay.fullName.trim() || 'A teammate',
			origin: url.origin
		});

		if (!result.ok) {
			return fail(result.reason === 'MAIL_NOT_CONFIGURED' ? 503 : 404, {
				resendForm: form,
				resendMessage:
					result.reason === 'MAIL_NOT_CONFIGURED'
						? TEAM_INVITATION_MAIL_NOT_CONFIGURED_MESSAGE
						: TEAM_INVITATION_RESEND_FAILED_MESSAGE
			});
		}

		return {
			resendForm: form,
			resendMessage: TEAM_INVITATION_RESENT_MESSAGE
		};
	},
	cancel: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(cancelTeamInvitationSchema));

		if (!locals.user) {
			return fail(401, { cancelForm: form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace) {
			return fail(400, {
				cancelForm: form,
				cancelMessage: TEAM_INVITATION_NO_WORKSPACE_MESSAGE
			});
		}

		if (!canInviteWorkspaceMembers(workspace.role)) {
			return fail(403, {
				cancelForm: form,
				cancelMessage: TEAM_INVITATION_NO_WORKSPACE_MESSAGE
			});
		}

		if (!form.valid) {
			return fail(400, { cancelForm: form });
		}

		if (!ObjectId.isValid(form.data.invitationId)) {
			return fail(400, {
				cancelForm: form,
				cancelMessage: TEAM_INVITATION_CANCEL_FAILED_MESSAGE
			});
		}

		await ensureWorkspaceInvitationIndexes();

		const revoked = await revokeWorkspaceInvitation({
			invitationId: form.data.invitationId,
			workspaceId: workspace.workspaceId
		});

		if (!revoked) {
			return fail(404, {
				cancelForm: form,
				cancelMessage: TEAM_INVITATION_CANCEL_FAILED_MESSAGE
			});
		}

		return {
			cancelForm: form,
			cancelMessage: TEAM_INVITATION_CANCELLED_MESSAGE
		};
	}
};
