import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { queueVerificationEmailForWeb } from '$lib/server/auth/email-verification';
import { safeRedirectPath } from '$lib/server/auth/post-auth-navigation';
import { getAuthRateLimitFormFailure } from '$lib/server/security/auth-rate-limit-form';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { resendVerificationSchema } from '$lib/shared/schemas/auth';
import { safeEmailPrefill } from '$lib/shared/auth-prefill';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
import { AUTH_RATE_LIMIT_MESSAGE } from '$lib/shared/auth-messages';

export const load: PageServerLoad = async ({ url }) => {
	const form = await superValidate(zod4(resendVerificationSchema), {
		defaults: { email: safeEmailPrefill(url.searchParams.get('email')) }
	});

	return {
		form,
		redirectTo: safeRedirectPath(url.searchParams.get('redirectTo')),
		meta: {
			title: 'Resend verification email'
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, url, getClientAddress } = event;
		const form = await superValidate(request, zod4(resendVerificationSchema));

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
			action: RECAPTCHA_ACTIONS.RESEND_VERIFICATION,
			remoteIp: getClientAddress()
		});

		if (!recaptcha.ok) {
			return message(form, recaptcha.message, { status: 400 });
		}

		const result = await queueVerificationEmailForWeb(event, {
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

			if (result.reason === 'THROTTLED') {
				return message(form, AUTH_RATE_LIMIT_MESSAGE, { status: 429 });
			}

			return message(
				form,
				'We could not send the verification email. Check SMTP settings and MailHog (http://localhost:8025), then try again.',
				{ status: 503 }
			);
		}

		const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
		const verifyUrl = new URL('/verify', url.origin);
		verifyUrl.searchParams.set('email', form.data.email);
		verifyUrl.searchParams.set('sent', '1');

		if (redirectTo !== '/') {
			verifyUrl.searchParams.set('redirectTo', redirectTo);
		}

		return redirect(303, `${verifyUrl.pathname}${verifyUrl.search}`);
	}
};
