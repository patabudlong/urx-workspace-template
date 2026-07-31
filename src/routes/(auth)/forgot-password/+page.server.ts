import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { requestPasswordReset } from '$lib/server/auth/password-reset';
import { getAuthRateLimitFormFailure } from '$lib/server/security/auth-rate-limit-form';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from '$lib/shared/auth-messages';
import { forgotPasswordSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(forgotPasswordSchema), {
		defaults: { email: '' }
	});

	return {
		form,
		meta: {
			title: 'Forgot password'
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, url, getClientAddress } = event;
		const form = await superValidate(request, zod4(forgotPasswordSchema));

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
			action: RECAPTCHA_ACTIONS.FORGOT_PASSWORD,
			remoteIp: getClientAddress()
		});

		if (!recaptcha.ok) {
			return message(form, recaptcha.message, { status: 400 });
		}

		const result = await requestPasswordReset({
			email: form.data.email,
			origin: url.origin
		});

		if (!result.ok) {
			if (result.reason === 'MAIL_NOT_CONFIGURED') {
				return message(
					form,
					'Email is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM in your environment.',
					{ status: 503 }
				);
			}

			return message(
				form,
				'We could not send the reset email right now. Please try again in a few minutes.',
				{ status: 503 }
			);
		}

		return message(form, FORGOT_PASSWORD_SUCCESS_MESSAGE);
	}
};
