import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { registerWithCredentials } from '$lib/server/auth/signup';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '$lib/server/auth/session';
import { recordConsentEvent } from '$lib/server/repositories/consent-events';
import { getAuthRateLimitFormFailure } from '$lib/server/security/auth-rate-limit-form';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { signupSchema } from '$lib/shared/schemas/auth';
import { getAuthRedirectAlert } from '$lib/shared/auth-messages';
import { getGoogleAuthErrorMessage } from '$lib/shared/google-auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
import { LEGAL_POLICY_VERSION } from '$lib/shared/legal';
import { CONSENT_CONTEXTS, CONSENT_EVENT_TYPES } from '$lib/shared/models/consent-event';

function safeRedirectPath(value: string | null): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return '/';
	}

	return value;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(303, safeRedirectPath(url.searchParams.get('redirectTo')));
	}

	const form = await superValidate(zod4(signupSchema), {
		defaults: {
			firstName: '',
			lastName: '',
			email: '',
			password: '',
			acceptedTerms: false
		}
	});

	const authRedirectAlert = getAuthRedirectAlert(url.searchParams);

	return {
		form,
		redirectTo: safeRedirectPath(url.searchParams.get('redirectTo')),
		googleAuthError:
			authRedirectAlert.message ?? getGoogleAuthErrorMessage(url.searchParams.get('error')),
		rateLimitRetryAfter: authRedirectAlert.rateLimitRetryAfter,
		meta: {
			title: 'Sign up'
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, url, getClientAddress } = event;
		const form = await superValidate(request, zod4(signupSchema));

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
			action: RECAPTCHA_ACTIONS.SIGNUP,
			remoteIp: getClientAddress()
		});

		if (!recaptcha.ok) {
			return message(form, recaptcha.message, { status: 400 });
		}

		const ipAddress = getClientAddress();
		const termsConsent = {
			acceptedAt: new Date(),
			ipAddress,
			policyVersion: LEGAL_POLICY_VERSION
		};

		const [, result] = await Promise.all([
			recordConsentEvent({
				type: CONSENT_EVENT_TYPES.TERMS_SUBMIT,
				context: CONSENT_CONTEXTS.SIGNUP,
				ipAddress,
				userAgent: request.headers.get('user-agent') ?? undefined,
				email: form.data.email,
				policyVersion: LEGAL_POLICY_VERSION
			}),
			registerWithCredentials({
				firstName: form.data.firstName,
				lastName: form.data.lastName,
				email: form.data.email,
				password: form.data.password,
				termsConsent
			})
		]);

		if (!result.ok) {
			if (result.reason === 'AUTH_NOT_CONFIGURED') {
				return message(form, 'Authentication is not configured. Set JWT_SECRET in your environment.', {
					status: 503
				});
			}

			return message(form, 'An account with this email already exists.', { status: 409 });
		}

		cookies.set(SESSION_COOKIE_NAME, result.accessToken, getSessionCookieOptions());

		redirect(303, safeRedirectPath(url.searchParams.get('redirectTo')));
	}
};
