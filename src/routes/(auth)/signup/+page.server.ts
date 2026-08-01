import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { registerWithCredentials } from '$lib/server/auth/signup';
import { queueVerificationEmailForWeb } from '$lib/server/auth/email-verification';
import { recordEmailSignupConsent } from '$lib/server/repositories/consent-events';
import { getAuthRateLimitFormFailure } from '$lib/server/security/auth-rate-limit-form';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { signupSchema } from '$lib/shared/schemas/auth';
import {
	getAuthRedirectAlert,
	AUTH_RATE_LIMIT_MESSAGE,
	EMAIL_ALREADY_EXISTS_MESSAGE
} from '$lib/shared/auth-messages';
import { getGoogleAuthErrorMessage } from '$lib/shared/google-auth';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
import { LEGAL_POLICY_VERSION } from '$lib/shared/legal';
import {
	resolveAuthenticatedLandingPath,
	safeRedirectPath
} from '$lib/server/auth/post-auth-navigation';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(
			303,
			await resolveAuthenticatedLandingPath(locals.user.id, url.searchParams.get('redirectTo'))
		);
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
		const { request, url, getClientAddress } = event;
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

		const result = await registerWithCredentials({
			firstName: form.data.firstName,
			lastName: form.data.lastName,
			email: form.data.email,
			password: form.data.password,
			termsConsent
		});

		if (!result.ok) {
			return message(form, EMAIL_ALREADY_EXISTS_MESSAGE, { status: 409 });
		}

		const [, emailResult] = await Promise.all([
			recordEmailSignupConsent({
				userId: result.user.id,
				email: form.data.email,
				ipAddress,
				userAgent: request.headers.get('user-agent') ?? undefined,
				policyVersion: LEGAL_POLICY_VERSION
			}),
			queueVerificationEmailForWeb(event, {
				email: form.data.email,
				origin: url.origin
			})
		]);

		if (!emailResult.ok) {
			if (emailResult.reason === 'MAIL_NOT_CONFIGURED') {
				return message(
					form,
					'Your account was created, but email is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM in your environment.',
					{ status: 503 }
				);
			}

			if (emailResult.reason === 'THROTTLED') {
				return message(form, AUTH_RATE_LIMIT_MESSAGE, { status: 429 });
			}

			return message(
				form,
				'Your account was created, but we could not send the verification email. Check SMTP settings and MailHog (http://localhost:8025), then try resending.',
				{ status: 503 }
			);
		}

		redirect(
			303,
			`/verify?email=${encodeURIComponent(form.data.email)}&sent=1&source=signup`
		);
	}
};
