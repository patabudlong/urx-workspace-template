import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	queuePhoneVerificationSmsForWeb,
	updateUserPhoneNumberForWeb,
	verifyPhoneWithCode
} from '$lib/server/auth/phone-verification';
import { toUserProfile } from '$lib/server/auth/user-profile';
import { findUserById, updateUserProfile } from '$lib/server/repositories/users';
import { requireWorkspaceMember } from '$lib/server/workspace-access';
import {
	PHONE_ALREADY_IN_USE_MESSAGE,
	PHONE_NUMBER_REQUIRED_MESSAGE,
	PHONE_UPDATED_MESSAGE,
	PHONE_UPDATE_FAILED_MESSAGE,
	PHONE_VERIFICATION_ALREADY_VERIFIED_MESSAGE,
	PHONE_VERIFICATION_INVALID_MESSAGE,
	PHONE_VERIFICATION_NOT_CONFIGURED_MESSAGE,
	PHONE_VERIFICATION_SEND_FAILED_MESSAGE,
	PHONE_VERIFICATION_SENT_MESSAGE,
	PHONE_VERIFICATION_THROTTLED_MESSAGE,
	PHONE_VERIFIED_MESSAGE,
	PROFILE_UPDATE_FAILED_MESSAGE,
	PROFILE_UPDATED_MESSAGE
} from '$lib/shared/account-messages';
import {
	updatePhoneNumberSchema,
	updateProfileSchema,
	verifyPhoneSchema
} from '$lib/shared/schemas/account';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	const user = await findUserById(locals.user!.id);

	if (!user) {
		error(404, 'User not found');
	}

	const form = await superValidate(
		{
			firstName: user.firstName,
			lastName: user.lastName
		},
		zod4(updateProfileSchema),
		{ id: 'profileForm' }
	);

	const phoneForm = await superValidate(
		{
			phoneNumber: user.phoneNumber ?? ''
		},
		zod4(updatePhoneNumberSchema),
		{ id: 'phoneForm' }
	);

	const verifyPhoneForm = await superValidate(zod4(verifyPhoneSchema), { id: 'verifyPhoneForm' });
	const resendPhoneForm = await superValidate(zod4(verifyPhoneSchema), { id: 'resendPhoneForm' });

	return {
		profile: toUserProfile(user),
		form,
		phoneForm,
		verifyPhoneForm,
		resendPhoneForm,
		meta: {
			title: 'Account'
		}
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(updateProfileSchema), { id: 'profileForm' });

		if (!locals.user) {
			return fail(401, { form });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const updated = await updateUserProfile(locals.user.id, form.data);

		if (!updated) {
			return message(form, PROFILE_UPDATE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PROFILE_UPDATED_MESSAGE);
	},
	updatePhoneNumber: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(updatePhoneNumberSchema), { id: 'phoneForm' });

		if (!locals.user) {
			return fail(401, { phoneForm: form });
		}

		if (!form.valid) {
			return fail(400, { phoneForm: form });
		}

		const phoneNumber = form.data.phoneNumber || null;
		const result = await updateUserPhoneNumberForWeb({
			userId: locals.user.id,
			phoneNumber
		});

		if (!result.ok) {
			if (result.reason === 'PHONE_IN_USE') {
				return message(form, PHONE_ALREADY_IN_USE_MESSAGE, { status: 409 });
			}

			return message(form, PHONE_UPDATE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PHONE_UPDATED_MESSAGE);
	},
	resendPhoneVerification: async ({ locals }) => {
		const form = await superValidate(zod4(verifyPhoneSchema), { id: 'resendPhoneForm' });

		if (!locals.user) {
			return fail(401, { resendPhoneForm: form });
		}

		const user = await findUserById(locals.user.id);

		if (!user?.phoneNumber) {
			return message(form, PHONE_NUMBER_REQUIRED_MESSAGE, { status: 400 });
		}

		const result = await queuePhoneVerificationSmsForWeb({
			userId: locals.user.id,
			phoneNumber: user.phoneNumber
		});

		if (!result.ok) {
			if (result.reason === 'SMS_NOT_CONFIGURED') {
				return message(form, PHONE_VERIFICATION_NOT_CONFIGURED_MESSAGE, { status: 503 });
			}

			if (result.reason === 'THROTTLED') {
				return message(form, PHONE_VERIFICATION_THROTTLED_MESSAGE, { status: 429 });
			}

			return message(form, PHONE_VERIFICATION_SEND_FAILED_MESSAGE, { status: 503 });
		}

		return message(form, PHONE_VERIFICATION_SENT_MESSAGE);
	},
	verifyPhoneNumber: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(verifyPhoneSchema), { id: 'verifyPhoneForm' });

		if (!locals.user) {
			return fail(401, { verifyPhoneForm: form });
		}

		if (!form.valid) {
			return fail(400, { verifyPhoneForm: form });
		}

		const result = await verifyPhoneWithCode({
			userId: locals.user.id,
			code: form.data.code
		});

		if (!result.ok) {
			if (result.reason === 'ALREADY_VERIFIED') {
				return message(form, PHONE_VERIFICATION_ALREADY_VERIFIED_MESSAGE, { status: 400 });
			}

			if (result.reason === 'INVALID_CODE') {
				return message(form, PHONE_VERIFICATION_INVALID_MESSAGE, { status: 400 });
			}

			return message(form, PHONE_VERIFICATION_INVALID_MESSAGE, { status: 400 });
		}

		return message(form, PHONE_VERIFIED_MESSAGE);
	}
};
