import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { findUserById } from '$lib/server/repositories/users';
import {
	getOnboardingAccessState,
	joinWorkspaceAsMember,
	submitOwnerWorkspaceRequest
} from '$lib/server/onboarding/workspace-onboarding';
import {
	memberOnboardingSchema,
	ownerOnboardingSchema
} from '$lib/shared/schemas/onboarding';
import {
	WORKSPACE_COUNTRIES,
	WORKSPACE_TEAM_SIZE_OPTIONS
} from '$lib/shared/workspace-constants';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { isSuperadmin } = await parent();
	const user = await findUserById(locals.user!.id);
	const access = await getOnboardingAccessState(locals.user!.id);

	const ownerForm = await superValidate(zod4(ownerOnboardingSchema), {
		defaults: {
			name: '',
			slug: '',
			contactPhone: '',
			teamSize: WORKSPACE_TEAM_SIZE_OPTIONS[0].value,
			addressLine1: '',
			addressLine2: '',
			city: '',
			region: '',
			postalCode: '',
			country: WORKSPACE_COUNTRIES[0],
			website: ''
		}
	});

	const memberForm = await superValidate(zod4(memberOnboardingSchema), {
		defaults: {
			workspaceRef: ''
		}
	});

	return {
		firstName: user?.firstName ?? '',
		userEmail: user?.email ?? locals.user!.email,
		access,
		isSuperadmin,
		ownerForm,
		memberForm,
		teamSizeOptions: WORKSPACE_TEAM_SIZE_OPTIONS,
		countries: WORKSPACE_COUNTRIES,
		meta: {
			title: 'Get started'
		}
	};
};

export const actions: Actions = {
	owner: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod4(ownerOnboardingSchema));

		if (!form.valid) {
			return fail(400, { ownerForm: form });
		}

		const brandLogoEntry = formData.get('brandLogo');
		const brandLogo =
			brandLogoEntry instanceof File && brandLogoEntry.size > 0 ? brandLogoEntry : undefined;

		const result = await submitOwnerWorkspaceRequest({
			userId: locals.user!.id,
			origin: url.origin,
			data: form.data,
			brandLogo
		});

		if (!result.ok) {
			const messages: Record<typeof result.reason, string> = {
				ALREADY_HAS_WORKSPACE: 'You already belong to a workspace.',
				PENDING_REQUEST_EXISTS: 'You already have a workspace request under review.',
				NAME_TAKEN: 'This workspace name is already taken. Choose a different name.',
				SLUG_TAKEN: 'This workspace URL is already taken. Choose a different name or slug.',
				MAIL_NOT_CONFIGURED:
					'Email is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM in your environment.',
				TEAM_EMAIL_NOT_CONFIGURED:
					'Workspace review email is not configured. Set WORKSPACE_REVIEW_TEAM_EMAIL in your environment.',
				BRAND_LOGO_INVALID: 'Upload a PNG, JPG, WebP, or SVG logo up to 2 MB.',
				BRAND_LOGO_TOO_LARGE: 'Logo must be 2 MB or smaller.'
			};

			return message(form, messages[result.reason], { status: 400 });
		}

		redirect(303, '/onboarding');
	},
	member: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(memberOnboardingSchema));

		if (!form.valid) {
			return fail(400, { memberForm: form });
		}

		const result = await joinWorkspaceAsMember({
			userId: locals.user!.id,
			data: form.data
		});

		if (!result.ok) {
			const messages: Record<typeof result.reason, string> = {
				ALREADY_HAS_WORKSPACE: 'You already belong to a workspace.',
				PENDING_REQUEST_EXISTS:
					'You have a pending workspace owner request. Wait for approval or contact support.',
				WORKSPACE_NOT_FOUND: 'No workspace found with that slug or ID.',
				WORKSPACE_NOT_ACTIVE: 'That workspace is not available to join yet.'
			};

			return message(form, messages[result.reason], { status: 400 });
		}

		redirect(303, '/');
	}
};
