import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { changePasswordForUser } from '$lib/server/auth/change-password';
import { toSecurityProfile } from '$lib/server/auth/security-profile';
import { findUserById } from '$lib/server/repositories/users';
import { consumeChangePasswordRateLimit } from '$lib/server/security/account-security-rate-limit';
import { requireWorkspaceMember } from '$lib/server/workspace-access';
import {
	createAuthRateLimitMessage,
	PASSWORD_REUSE_MESSAGE,
	PASSWORD_WEAK_MESSAGE
} from '$lib/shared/auth-messages';
import {
	CURRENT_PASSWORD_INVALID_MESSAGE,
	PASSWORD_CHANGE_FAILED_MESSAGE,
	PASSWORD_CHANGE_NOT_AVAILABLE_MESSAGE,
	PASSWORD_CHANGED_MESSAGE
} from '$lib/shared/security-messages';
import { changePasswordSchema } from '$lib/shared/schemas/security';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	const user = await findUserById(locals.user!.id);

	if (!user) {
		error(404, 'User not found');
	}

	const changePasswordForm = await superValidate(
		{
			currentPassword: '',
			newPassword: ''
		},
		zod4(changePasswordSchema),
		{ id: 'changePasswordForm', errors: false }
	);

	return {
		security: toSecurityProfile(user),
		changePasswordForm,
		meta: {
			title: 'Security'
		}
	};
};

export const actions: Actions = {
	changePassword: async ({ request, locals, getClientAddress, url }) => {
		const form = await superValidate(request, zod4(changePasswordSchema), {
			id: 'changePasswordForm'
		});

		if (!locals.user) {
			return fail(401, { changePasswordForm: form });
		}

		const rateLimited = consumeChangePasswordRateLimit({
			userId: locals.user.id,
			clientIp: getClientAddress()
		});

		if (!rateLimited.ok) {
			return message(form, createAuthRateLimitMessage(rateLimited.retryAfterSeconds), {
				status: 429
			});
		}

		if (!form.valid) {
			return fail(400, { changePasswordForm: form });
		}

		const result = await changePasswordForUser({
			userId: locals.user.id,
			currentPassword: form.data.currentPassword,
			newPassword: form.data.newPassword,
			origin: url.origin
		});

		if (!result.ok) {
			if (result.reason === 'NO_APP_PASSWORD') {
				return message(form, PASSWORD_CHANGE_NOT_AVAILABLE_MESSAGE, { status: 400 });
			}

			if (result.reason === 'INVALID_CURRENT_PASSWORD') {
				return message(form, CURRENT_PASSWORD_INVALID_MESSAGE, { status: 400 });
			}

			if (result.reason === 'WEAK_PASSWORD') {
				return message(form, PASSWORD_WEAK_MESSAGE, { status: 400 });
			}

			if (result.reason === 'PASSWORD_REUSED') {
				return message(form, PASSWORD_REUSE_MESSAGE, { status: 400 });
			}

			return message(form, PASSWORD_CHANGE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PASSWORD_CHANGED_MESSAGE);
	}
};
