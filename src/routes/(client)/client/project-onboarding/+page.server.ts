import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	getPmClientOnboardingPreview,
	submitPmClientOnboarding
} from '$lib/server/project-management/client-onboarding';
import {
	PM_CLIENT_ONBOARDING_ALREADY_SUBMITTED_MESSAGE,
	PM_CLIENT_ONBOARDING_INVALID_LINK_MESSAGE,
	PM_CLIENT_ONBOARDING_SUBMIT_FAILED_MESSAGE,
	PM_CLIENT_ONBOARDING_SUBMITTED_MESSAGE
} from '$lib/shared/project-management/messages';
import { pmProjectIncludesWebsite } from '$lib/shared/project-management/project-types';
import {
	pmClientOnboardingFormDefaults,
	pmClientOnboardingFormSchema
} from '$lib/shared/project-management/schemas';

export const load: PageServerLoad = async ({ url }) => {
	const token = (url.searchParams.get('token') ?? '').trim();
	const preview = token ? await getPmClientOnboardingPreview(token) : null;

	const defaults = preview
		? {
				...pmClientOnboardingFormDefaults,
				contactEmail: preview.clientEmail,
				contactName: preview.clientName ?? '',
				businessName: preview.clientName ?? ''
			}
		: pmClientOnboardingFormDefaults;

	return {
		token,
		preview,
		form: await superValidate(zod4(pmClientOnboardingFormSchema), { defaults }),
		meta: {
			title: 'Project onboarding'
		}
	};
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const token = (url.searchParams.get('token') ?? '').trim();
		const form = await superValidate(request, zod4(pmClientOnboardingFormSchema));

		if (!token) {
			return fail(400, { form, message: PM_CLIENT_ONBOARDING_INVALID_LINK_MESSAGE });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const preview = await getPmClientOnboardingPreview(token);
		if (
			preview &&
			pmProjectIncludesWebsite(preview.projectTypes) &&
			(!form.data.domainStatus || !form.data.hostingPreference)
		) {
			return fail(400, {
				form,
				message: 'Domain and hosting preferences are required for website projects.'
			});
		}

		const result = await submitPmClientOnboarding({ token, data: form.data });

		if (!result.ok) {
			if (result.reason === 'ALREADY_SUBMITTED') {
				return fail(409, { form, message: PM_CLIENT_ONBOARDING_ALREADY_SUBMITTED_MESSAGE });
			}

			if (result.reason === 'EMAIL_MISMATCH') {
				return fail(400, {
					form,
					message: 'Use the same email address that received this invitation.'
				});
			}

			return fail(400, {
				form,
				message:
					result.reason === 'INVALID_TOKEN'
						? PM_CLIENT_ONBOARDING_INVALID_LINK_MESSAGE
						: PM_CLIENT_ONBOARDING_SUBMIT_FAILED_MESSAGE
			});
		}

		return message(form, PM_CLIENT_ONBOARDING_SUBMITTED_MESSAGE);
	}
};
