import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { verifyTwoFactorPendingToken } from '$lib/server/auth/jwt';
import {
	getTwoFactorPendingCookieOptions,
	sendTwoFactorLoginCode,
	TWO_FACTOR_PENDING_COOKIE_NAME,
	verifyTwoFactorChallenge
} from '$lib/server/auth/two-factor/challenge';
import { setTrustedDeviceCookie } from '$lib/server/auth/two-factor/trusted-devices';
import {
	resolveAuthenticatedLandingPath,
	safeRedirectPath
} from '$lib/server/auth/post-auth-navigation';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '$lib/server/auth/session';
import { findUserById } from '$lib/server/repositories/users';
import { getEnabledTwoFactorMethods } from '$lib/server/repositories/user-two-factor';
import { INVALID_VERIFICATION_CODE_MESSAGE, createAuthRateLimitMessage } from '$lib/shared/auth-messages';
import { TWO_FACTOR_METHODS } from '$lib/shared/models/two-factor';
import { twoFactorLoginChallengeSchema } from '$lib/shared/schemas/security';
import { TWO_FACTOR_SEND_FAILED_MESSAGE } from '$lib/shared/security-messages';
import { resolveWorkspaceIdBySlug } from '$lib/server/security/request-workspace-context';
import {
	recordTwoFactorFailedInBackground,
	recordTwoFactorSuccessInBackground
} from '$lib/server/security/record-security-event';

const sendTwoFactorCodeSchema = z.object({
	method: z.enum([TWO_FACTOR_METHODS.SMS, TWO_FACTOR_METHODS.EMAIL])
});

export const load: PageServerLoad = async ({ cookies, url }) => {
	const pendingToken = cookies.get(TWO_FACTOR_PENDING_COOKIE_NAME);
	const payload = pendingToken ? await verifyTwoFactorPendingToken(pendingToken) : null;

	if (!payload) {
		redirect(303, '/login');
	}

	const user = await findUserById(payload.sub);
	const methods = user ? getEnabledTwoFactorMethods(user) : [];

	const form = await superValidate(
		{
			method: methods[0] ?? TWO_FACTOR_METHODS.TOTP,
			code: '',
			rememberDevice: false
		},
		zod4(twoFactorLoginChallengeSchema),
		{ id: 'twoFactorLoginForm', errors: false }
	);

	return {
		form,
		methods,
		redirectTo: safeRedirectPath(url.searchParams.get('redirectTo')),
		meta: {
			title: 'Two-factor authentication'
		}
	};
};

export const actions: Actions = {
	verify: async (event) => {
		const { request, cookies, url, getClientAddress } = event;
		const form = await superValidate(request, zod4(twoFactorLoginChallengeSchema), {
			id: 'twoFactorLoginForm'
		});

		const pendingToken = cookies.get(TWO_FACTOR_PENDING_COOKIE_NAME);
		const payload = pendingToken ? await verifyTwoFactorPendingToken(pendingToken) : null;

		if (!payload) {
			return message(form, 'Your sign-in session expired. Sign in again.', { status: 401 });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const result = await verifyTwoFactorChallenge({
			userId: payload.sub,
			code: form.data.code,
			method: form.data.method,
			rememberDevice: form.data.rememberDevice
		});

		if (!result.ok) {
			recordTwoFactorFailedInBackground(event, {
				userId: payload.sub,
				ipAddress: getClientAddress(),
				userAgent: request.headers.get('user-agent') ?? undefined
			});
			return message(form, INVALID_VERIFICATION_CODE_MESSAGE, { status: 400 });
		}

		cookies.delete(TWO_FACTOR_PENDING_COOKIE_NAME, getTwoFactorPendingCookieOptions());
		cookies.set(SESSION_COOKIE_NAME, result.session.accessToken, getSessionCookieOptions());

		if (result.trustedDevice) {
			setTrustedDeviceCookie(cookies, result.trustedDevice);
		}

		const workspaceId = await resolveWorkspaceIdBySlug(result.session.user.id, url);
		recordTwoFactorSuccessInBackground(event, {
			userId: result.session.user.id,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') ?? undefined,
			method: form.data.method,
			workspaceId,
			origin: url.origin
		});

		redirect(
			303,
			await resolveAuthenticatedLandingPath(result.session.user.id, {
				requestedPath: url.searchParams.get('redirectTo'),
				requestUrl: url
			})
		);
	},
	sendCode: async ({ request, cookies, url, getClientAddress }) => {
		const form = await superValidate(request, zod4(sendTwoFactorCodeSchema), {
			id: 'twoFactorSendCodeForm'
		});

		const pendingToken = cookies.get(TWO_FACTOR_PENDING_COOKIE_NAME);
		const payload = pendingToken ? await verifyTwoFactorPendingToken(pendingToken) : null;

		if (!payload) {
			return message(form, 'Your sign-in session expired. Sign in again.', { status: 401 });
		}

		if (!form.valid || form.data.method !== TWO_FACTOR_METHODS.SMS && form.data.method !== TWO_FACTOR_METHODS.EMAIL) {
			return fail(400, { form });
		}

		const sent = await sendTwoFactorLoginCode({
			userId: payload.sub,
			method: form.data.method as 'sms' | 'email',
			origin: url.origin,
			clientIp: getClientAddress()
		});

		if (!sent.ok) {
			if (sent.reason === 'THROTTLED') {
				return fail(429, {
					rateLimit: createAuthRateLimitMessage(sent.retryAfterSeconds ?? 60)
				});
			}

			return fail(500, { error: TWO_FACTOR_SEND_FAILED_MESSAGE });
		}

		return { sent: true };
	}
};
