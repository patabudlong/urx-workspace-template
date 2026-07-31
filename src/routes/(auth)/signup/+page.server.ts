import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { registerWithCredentials } from '$lib/server/auth/signup';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '$lib/server/auth/session';
import { signupSchema } from '$lib/shared/schemas/auth';

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

	const form = await superValidate(zod4(signupSchema));

	return {
		form,
		redirectTo: safeRedirectPath(url.searchParams.get('redirectTo')),
		meta: {
			title: 'Sign up'
		}
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod4(signupSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const result = await registerWithCredentials({
			firstName: form.data.firstName,
			lastName: form.data.lastName,
			email: form.data.email,
			password: form.data.password
		});

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
