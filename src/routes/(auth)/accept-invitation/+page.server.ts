import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { getWorkspaceInvitationPreview, acceptWorkspaceInvitation } from '$lib/server/team/workspace-invitations';
import { resolveWorkspaceLandingUrl } from '$lib/server/workspace-host';
import {
	completeInvitationIfPossible,
	invitationMatchesUser
} from '$lib/server/team/invitation-redirect';
import { acceptInvitationSchema } from '$lib/shared/schemas/accept-invitation';
import {
	TEAM_INVITATION_ACCEPT_FAILED_MESSAGE,
	TEAM_INVITATION_EMAIL_MISMATCH_MESSAGE,
	TEAM_INVITATION_INVALID_LINK_MESSAGE
} from '$lib/shared/team/invitation-messages';

export const load: PageServerLoad = async ({ locals, url }) => {
	const token = (url.searchParams.get('token') ?? '').trim();
	const invitation = token ? await getWorkspaceInvitationPreview(token) : null;
	const tokenValid = invitation !== null;
	const userEmail = locals.user?.email?.trim().toLowerCase() ?? null;

	if (
		locals.user &&
		invitation &&
		invitationMatchesUser(invitation, userEmail)
	) {
		const completed = await completeInvitationIfPossible({
			token,
			userId: locals.user.id,
			userEmail: locals.user.email,
			requestUrl: url
		});

		if (completed.ok) {
			redirect(303, completed.landingPath);
		}
	}

	const form = await superValidate(zod4(acceptInvitationSchema), {
		defaults: { token }
	});

	return {
		form,
		tokenValid,
		invitation,
		isAuthenticated: Boolean(locals.user),
		emailMatches: invitation && userEmail ? userEmail === invitation.invitedEmail : null,
		meta: {
			title: 'Accept invitation'
		}
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
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
				return message(form, TEAM_INVITATION_EMAIL_MISMATCH_MESSAGE, { status: 403 });
			}

			return message(form, TEAM_INVITATION_ACCEPT_FAILED_MESSAGE, { status: 500 });
		}

		const landing = resolveWorkspaceLandingUrl(result.workspaceSlug, url, '/');
		redirect(303, `${landing}${landing.includes('?') ? '&' : '?'}invitation=accepted`);
	}
};
