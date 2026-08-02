import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	acceptWorkspaceInvitation,
	declineWorkspaceInvitation,
	getWorkspaceInvitationPreview
} from '$lib/server/team/workspace-invitations';
import { findUserByEmail } from '$lib/server/repositories/users';
import { resolveWorkspaceLandingUrl } from '$lib/server/workspace-host';
import { clearSessionCookie } from '$lib/server/auth/session';
import { acceptInvitationSchema } from '$lib/shared/schemas/accept-invitation';
import {
	TEAM_INVITATION_ACCEPT_FAILED_MESSAGE,
	TEAM_INVITATION_DECLINED_MESSAGE,
	TEAM_INVITATION_EMAIL_MISMATCH_MESSAGE,
	TEAM_INVITATION_INVALID_LINK_MESSAGE,
	TEAM_INVITATION_NO_WORKSPACE_MESSAGE
} from '$lib/shared/team/invitation-messages';

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	const token = (url.searchParams.get('token') ?? '').trim();
	const invitation = token ? await getWorkspaceInvitationPreview(token) : null;
	const tokenValid = invitation !== null;

	let sessionUser = locals.user;
	let autoAcceptError: string | null = null;

	if (tokenValid && invitation && sessionUser) {
		const userEmail = sessionUser.email.trim().toLowerCase();

		if (userEmail !== invitation.invitedEmail) {
			clearSessionCookie(cookies);
			sessionUser = undefined;
		} else {
			const result = await acceptWorkspaceInvitation({
				token,
				userId: sessionUser.id,
				userEmail: sessionUser.email
			});

			if (result.ok) {
				const landing = resolveWorkspaceLandingUrl(result.workspaceSlug, url, '/');
				redirect(303, `${landing}${landing.includes('?') ? '&' : '?'}invitation=accepted`);
			}

			if (result.reason === 'INVALID_TOKEN') {
				autoAcceptError = TEAM_INVITATION_INVALID_LINK_MESSAGE;
			} else if (result.reason === 'EMAIL_MISMATCH') {
				autoAcceptError = TEAM_INVITATION_EMAIL_MISMATCH_MESSAGE;
			} else if (result.reason === 'WORKSPACE_NOT_FOUND') {
				autoAcceptError = TEAM_INVITATION_NO_WORKSPACE_MESSAGE;
			} else {
				autoAcceptError = TEAM_INVITATION_ACCEPT_FAILED_MESSAGE;
			}
		}
	}

	const sessionEmail = sessionUser?.email?.trim().toLowerCase() ?? null;
	const inviteeHasAccount = invitation
		? Boolean(await findUserByEmail(invitation.invitedEmail))
		: false;

	const form = await superValidate(zod4(acceptInvitationSchema), {
		defaults: { token }
	});

	return {
		form,
		tokenValid,
		invitation,
		inviteeHasAccount,
		isAuthenticated: Boolean(sessionUser),
		autoAcceptError,
		emailMatches:
			invitation && sessionEmail ? sessionEmail === invitation.invitedEmail : null,
		meta: {
			title: 'Accept invitation'
		}
	};
};

export const actions: Actions = {
	accept: async ({ request, url, locals, cookies }) => {
		const form = await superValidate(request, zod4(acceptInvitationSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		if (!locals.user) {
			const redirectTo = encodeURIComponent(
				`/accept-invitation?token=${encodeURIComponent(form.data.token)}`
			);
			redirect(303, `/login?redirectTo=${redirectTo}`);
		}

		const result = await acceptWorkspaceInvitation({
			token: form.data.token,
			userId: locals.user.id,
			userEmail: locals.user.email
		});

		if (!result.ok) {
			if (result.reason === 'INVALID_TOKEN') {
				return message(form, TEAM_INVITATION_INVALID_LINK_MESSAGE, { status: 400 });
			}

			if (result.reason === 'EMAIL_MISMATCH') {
				clearSessionCookie(cookies);

				const acceptPath = `/accept-invitation?token=${encodeURIComponent(form.data.token)}`;
				const loginUrl = new URL('/login', url.origin);
				loginUrl.searchParams.set('redirectTo', acceptPath);

				const invitation = await getWorkspaceInvitationPreview(form.data.token);

				if (invitation) {
					loginUrl.searchParams.set('email', invitation.invitedEmail);
				}

				redirect(303, `${loginUrl.pathname}${loginUrl.search}`);
			}

			return message(form, TEAM_INVITATION_ACCEPT_FAILED_MESSAGE, { status: 500 });
		}

		const landing = resolveWorkspaceLandingUrl(result.workspaceSlug, url, '/');
		redirect(303, `${landing}${landing.includes('?') ? '&' : '?'}invitation=accepted`);
	},
	decline: async ({ request }) => {
		const form = await superValidate(request, zod4(acceptInvitationSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const result = await declineWorkspaceInvitation(form.data.token);

		if (!result.ok) {
			return message(form, TEAM_INVITATION_INVALID_LINK_MESSAGE, { status: 400 });
		}

		return message(form, TEAM_INVITATION_DECLINED_MESSAGE);
	}
};
