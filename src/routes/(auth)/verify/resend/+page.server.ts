import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { queueVerificationEmailForWeb } from '$lib/server/auth/email-verification';
import { getAuthRateLimitFormFailure } from '$lib/server/security/auth-rate-limit-form';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { resendVerificationSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

function safeEmailPrefill(value: string | null): string {
	if (!value) {
		return '';
	}

	const trimmed = value.trim().toLowerCase();
	return trimmed.includes('@') ? trimmed : '';
}

export const load: PageServerLoad = async ({ url }) => {
	const form = await superValidate(zod4(resendVerificationSchema), {
		defaults: { email: safeEmailPrefill(url.searchParams.get('email')) }
	});

	return {
		form,
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
			return message(
				form,
				'Email is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM in your environment.',
				{ status: 503 }
			);
		}

		return redirect(
			303,
			`/verify?email=${encodeURIComponent(form.data.email)}&sent=1`
		);
	}
};
