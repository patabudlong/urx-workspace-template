import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import {
	isPasswordResetTokenValid,
	resetPasswordWithToken
} from '$lib/server/auth/password-reset';
import { getAuthRateLimitFormFailure } from '$lib/server/security/auth-rate-limit-form';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { resetPasswordSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(303, '/');
	}

	const token = url.searchParams.get('token') ?? '';
	const tokenValid = token ? await isPasswordResetTokenValid(token) : false;

	const form = await superValidate(zod4(resetPasswordSchema), {
		defaults: {
			token,
			password: ''
		}
	});

	return {
		form,
		tokenValid,
		meta: {
			title: 'Reset password'
		}
	};
};

export const actions: Actions = {
	default: async ({ request, url, getClientAddress }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));

		const rateLimited = getAuthRateLimitFormFailure(form, {
			clientIp: getClientAddress(),
			pathname: url.pathname
		});

		if (rateLimited) {
			return rateLimited;
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const recaptcha = await assertAuthRecaptcha({
			token: form.data.recaptchaToken,
			action: RECAPTCHA_ACTIONS.RESET_PASSWORD,
			remoteIp: getClientAddress()
		});

		if (!recaptcha.ok) {
			return message(form, recaptcha.message, { status: 400 });
		}

		const result = await resetPasswordWithToken({
			token: form.data.token,
			password: form.data.password
		});

		if (!result.ok) {
			if (result.reason === 'INVALID_TOKEN') {
				return message(form, 'This reset link is invalid or has expired. Request a new one.', {
					status: 400
				});
			}

			return message(form, 'We could not update your password. Please try again.', { status: 500 });
		}

		redirect(303, '/login?reset=success');
	}
};
