import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { verifyEmailWithCode } from '$lib/server/auth/email-verification';
import { getAuthRateLimitFormFailure } from '$lib/server/security/auth-rate-limit-form';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { verifyEmailSchema } from '$lib/shared/schemas/auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
import {
	INVALID_VERIFICATION_CODE_MESSAGE,
	EMAIL_ALREADY_VERIFIED_MESSAGE,
	RESEND_VERIFICATION_SUCCESS_MESSAGE,
	SIGNUP_VERIFICATION_SENT_MESSAGE
} from '$lib/shared/auth-messages';

function safeEmailPrefill(value: string | null): string {
	if (!value) {
		return '';
	}

	const trimmed = value.trim().toLowerCase();
	return trimmed.includes('@') ? trimmed : '';
}

export const load: PageServerLoad = async ({ url }) => {
	const prefilledEmail = safeEmailPrefill(url.searchParams.get('email'));

	if (!prefilledEmail) {
		redirect(303, '/verify/resend');
	}

	const form = await superValidate(zod4(verifyEmailSchema), {
		defaults: {
			email: prefilledEmail,
			code: ''
		}
	});

	return {
		form,
		prefilledEmail,
		codeSent: url.searchParams.get('sent') === '1',
		codeSentMessage:
			url.searchParams.get('source') === 'signup'
				? SIGNUP_VERIFICATION_SENT_MESSAGE
				: RESEND_VERIFICATION_SUCCESS_MESSAGE,
		meta: {
			title: 'Verify email'
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, url, getClientAddress } = event;
		const form = await superValidate(request, zod4(verifyEmailSchema));

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
			action: RECAPTCHA_ACTIONS.VERIFY_EMAIL,
			remoteIp: getClientAddress()
		});

		if (!recaptcha.ok) {
			return message(form, recaptcha.message, { status: 400 });
		}

		const result = await verifyEmailWithCode({
			email: form.data.email,
			code: form.data.code
		});

		if (!result.ok) {
			if (result.reason === 'ALREADY_VERIFIED') {
				return message(form, EMAIL_ALREADY_VERIFIED_MESSAGE, { status: 409 });
			}

			return message(form, INVALID_VERIFICATION_CODE_MESSAGE, { status: 400 });
		}

		return message(form, 'verified');
	}
};
