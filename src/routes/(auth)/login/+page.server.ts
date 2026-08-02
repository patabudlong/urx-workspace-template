import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { authenticateWithCredentials } from '$lib/server/auth/login';
import {
	resolveAuthenticatedLandingPath,
	safeRedirectPath
} from '$lib/server/auth/post-auth-navigation';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '$lib/server/auth/session';
import { getAuthRateLimitFormFailure } from '$lib/server/security/auth-rate-limit-form';
import { assertAuthRecaptcha } from '$lib/server/security/recaptcha';
import { loginSchema } from '$lib/shared/schemas/auth';
import {
	EMAIL_NOT_VERIFIED_MESSAGE,
	getAuthRedirectAlert,
	INVALID_CREDENTIALS_MESSAGE
} from '$lib/shared/auth-messages';
import { getGoogleAuthErrorMessage } from '$lib/shared/google-auth';
import { safeEmailPrefill } from '$lib/shared/auth-prefill';
import { getInvitationFlowLockedEmail } from '$lib/shared/team/invitation-flow';
import { TEAM_INVITATION_EMAIL_LOCKED_MISMATCH_MESSAGE } from '$lib/shared/team/invitation-messages';
import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(
			303,
			await resolveAuthenticatedLandingPath(locals.user.id, {
				requestedPath: url.searchParams.get('redirectTo'),
				requestUrl: url
			})
		);
	}

	const prefilledEmail = safeEmailPrefill(url.searchParams.get('email'));

	const redirectTo = safeRedirectPath(url.searchParams.get('redirectTo'));
	const lockedEmail = getInvitationFlowLockedEmail(redirectTo, url.searchParams.get('email'));

	const form = await superValidate(zod4(loginSchema), {
		defaults: {
			email: lockedEmail ?? prefilledEmail,
			password: ''
		}
	});

	const authRedirectAlert = getAuthRedirectAlert(url.searchParams);

	return {
		form,
		redirectTo,
		lockedEmail,
		googleAuthError:
			authRedirectAlert.message ?? getGoogleAuthErrorMessage(url.searchParams.get('error')),
		rateLimitRetryAfter: authRedirectAlert.rateLimitRetryAfter,
		passwordResetSuccess: url.searchParams.get('reset') === 'success',
		meta: {
			title: 'Sign in'
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, url, getClientAddress } = event;
		const form = await superValidate(request, zod4(loginSchema));

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

		const lockedEmail = getInvitationFlowLockedEmail(
			safeRedirectPath(url.searchParams.get('redirectTo')),
			url.searchParams.get('email')
		);

		if (lockedEmail && form.data.email.trim().toLowerCase() !== lockedEmail) {
			return message(form, TEAM_INVITATION_EMAIL_LOCKED_MISMATCH_MESSAGE, { status: 400 });
		}

		const [recaptcha, result] = await Promise.all([
			assertAuthRecaptcha({
				token: form.data.recaptchaToken,
				action: RECAPTCHA_ACTIONS.LOGIN,
				remoteIp: getClientAddress()
			}),
			authenticateWithCredentials(form.data.email, form.data.password)
		]);

		if (!recaptcha.ok) {
			return message(form, recaptcha.message, { status: 400 });
		}

		if (!result.ok) {
			if (result.reason === 'AUTH_NOT_CONFIGURED') {
				return message(form, 'Authentication is not configured. Set JWT_SECRET in your environment.', {
					status: 503
				});
			}

			if (result.reason === 'EMAIL_NOT_VERIFIED') {
				return message(form, EMAIL_NOT_VERIFIED_MESSAGE, { status: 403 });
			}

			return message(form, INVALID_CREDENTIALS_MESSAGE, { status: 401 });
		}

		cookies.set(SESSION_COOKIE_NAME, result.accessToken, getSessionCookieOptions());

		redirect(
			303,
			await resolveAuthenticatedLandingPath(result.user.id, {
				requestedPath: url.searchParams.get('redirectTo'),
				requestUrl: url
			})
		);
	}
};
