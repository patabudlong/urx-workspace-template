import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { changePasswordForUser } from '$lib/server/auth/change-password';
import { toSecurityProfile } from '$lib/server/auth/security-profile';
import { disableTwoFactor } from '$lib/server/auth/two-factor/disable';
import { verifySensitiveActionIdentity } from '$lib/server/auth/two-factor/verify-identity';
import {
	confirmSetupOtp,
	confirmTotpSetup,
	regenerateUserBackupCodes,
	sendSetupOtpCode,
	startTotpSetup
} from '$lib/server/auth/two-factor/setup';
import { findUserById } from '$lib/server/repositories/users';
import { removeTrustedDevice } from '$lib/server/repositories/user-two-factor';
import type { TwoFactorSecurityContext } from '$lib/server/mail/two-factor-email';
import { consumeChangePasswordRateLimit } from '$lib/server/security/account-security-rate-limit';
import { requireWorkspaceMember } from '$lib/server/workspace-access';
import {
	createAuthRateLimitMessage,
	PASSWORD_REUSE_MESSAGE,
	PASSWORD_WEAK_MESSAGE
} from '$lib/shared/auth-messages';
import {
	CURRENT_PASSWORD_INVALID_MESSAGE,
	PASSWORD_CHANGE_FAILED_MESSAGE,
	PASSWORD_CHANGE_NOT_AVAILABLE_MESSAGE,
	PASSWORD_CHANGED_MESSAGE,
	TWO_FACTOR_ALREADY_ENABLED_MESSAGE,
	TWO_FACTOR_BACKUP_CODES_REGENERATED_MESSAGE,
	TWO_FACTOR_CODE_SENT_MESSAGE,
	TWO_FACTOR_DISABLED_MESSAGE,
	TWO_FACTOR_DISABLE_PASSWORD_REQUIRED_MESSAGE,
	TWO_FACTOR_INVALID_CODE_MESSAGE,
	TWO_FACTOR_PHONE_REQUIRED_MESSAGE,
	TWO_FACTOR_SEND_FAILED_MESSAGE,
	TWO_FACTOR_SETUP_FAILED_MESSAGE,
	TWO_FACTOR_SMS_NOT_CONFIGURED_MESSAGE,
	TWO_FACTOR_TRUSTED_DEVICE_REVOKED_MESSAGE
} from '$lib/shared/security-messages';
import {
	changePasswordSchema,
	twoFactorDisableSchema,
	twoFactorDisableWithCodeSchema,
	twoFactorDisableWithPasswordSchema,
	twoFactorRegenerateBackupCodesSchema,
	twoFactorRegenerateBackupCodesWithCodeSchema,
	twoFactorRegenerateBackupCodesWithPasswordSchema,
	twoFactorSetupOtpConfirmSchema,
	twoFactorSetupTotpConfirmSchema
} from '$lib/shared/schemas/security';

function buildTwoFactorSecurityContext(event: {
	url: { origin: string };
	request: Request;
	getClientAddress: () => string;
}): TwoFactorSecurityContext {
	return {
		origin: event.url.origin,
		ipAddress: event.getClientAddress(),
		userAgent: event.request.headers.get('user-agent') ?? undefined
	};
}

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();

	requireWorkspaceMember(workspace);

	const user = await findUserById(locals.user!.id);

	if (!user) {
		error(404, 'User not found');
	}

	const security = toSecurityProfile(user);

	const changePasswordForm = await superValidate(
		{
			currentPassword: '',
			newPassword: ''
		},
		zod4(changePasswordSchema),
		{ id: 'changePasswordForm', errors: false }
	);

	const confirmTotpForm = await superValidate(
		{ code: '' },
		zod4(twoFactorSetupTotpConfirmSchema),
		{ id: 'confirmTotpForm', errors: false }
	);

	const confirmSmsForm = await superValidate(
		{ code: '' },
		zod4(twoFactorSetupOtpConfirmSchema),
		{ id: 'confirmSmsForm', errors: false }
	);

	const confirmEmailForm = await superValidate(
		{ code: '' },
		zod4(twoFactorSetupOtpConfirmSchema),
		{ id: 'confirmEmailForm', errors: false }
	);

	const disableTwoFactorForm = await superValidate(
		{
			password: '',
			code: '',
			method: user.passwordHash
				? undefined
				: security.twoFactor.totpEnabled
					? 'totp'
					: 'backup'
		},
		zod4(twoFactorDisableSchema),
		{ id: 'disableTwoFactorForm', errors: false }
	);

	const regenerateBackupCodesForm = await superValidate(
		{
			password: '',
			code: '',
			method: user.passwordHash ? undefined : 'totp'
		},
		zod4(twoFactorRegenerateBackupCodesSchema),
		{ id: 'regenerateBackupCodesForm', errors: false }
	);

	return {
		security,
		changePasswordForm,
		confirmTotpForm,
		confirmSmsForm,
		confirmEmailForm,
		disableTwoFactorForm,
		regenerateBackupCodesForm,
		meta: {
			title: 'Security'
		}
	};
};

export const actions: Actions = {
	changePassword: async ({ request, locals, getClientAddress, url }) => {
		const form = await superValidate(request, zod4(changePasswordSchema), {
			id: 'changePasswordForm'
		});

		if (!locals.user) {
			return fail(401, { changePasswordForm: form });
		}

		const rateLimited = consumeChangePasswordRateLimit({
			userId: locals.user.id,
			clientIp: getClientAddress()
		});

		if (!rateLimited.ok) {
			return message(form, createAuthRateLimitMessage(rateLimited.retryAfterSeconds), {
				status: 429
			});
		}

		if (!form.valid) {
			return fail(400, { changePasswordForm: form });
		}

		const result = await changePasswordForUser({
			userId: locals.user.id,
			currentPassword: form.data.currentPassword,
			newPassword: form.data.newPassword,
			origin: url.origin
		});

		if (!result.ok) {
			if (result.reason === 'NO_APP_PASSWORD') {
				return message(form, PASSWORD_CHANGE_NOT_AVAILABLE_MESSAGE, { status: 400 });
			}

			if (result.reason === 'INVALID_CURRENT_PASSWORD') {
				return message(form, CURRENT_PASSWORD_INVALID_MESSAGE, { status: 400 });
			}

			if (result.reason === 'WEAK_PASSWORD') {
				return message(form, PASSWORD_WEAK_MESSAGE, { status: 400 });
			}

			if (result.reason === 'PASSWORD_REUSED') {
				return message(form, PASSWORD_REUSE_MESSAGE, { status: 400 });
			}

			return message(form, PASSWORD_CHANGE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, PASSWORD_CHANGED_MESSAGE);
	},

	startTotpSetup: async ({ locals }) => {
		if (!locals.user) {
			return fail(401);
		}

		const result = await startTotpSetup(locals.user.id);

		if (!result.ok) {
			if (result.reason === 'ALREADY_ENABLED') {
				return fail(400, { error: TWO_FACTOR_ALREADY_ENABLED_MESSAGE });
			}

			return fail(500, { error: TWO_FACTOR_SETUP_FAILED_MESSAGE });
		}

		return {
			totpSetup: {
				qrDataUrl: result.qrDataUrl,
				manualKey: result.manualKey
			}
		};
	},

	confirmTotpSetup: async ({ request, locals, url, getClientAddress }) => {
		const form = await superValidate(request, zod4(twoFactorSetupTotpConfirmSchema), {
			id: 'confirmTotpForm'
		});

		if (!locals.user) {
			return fail(401, { confirmTotpForm: form });
		}

		if (!form.valid) {
			return fail(400, { confirmTotpForm: form });
		}

		const result = await confirmTotpSetup({
			userId: locals.user.id,
			code: form.data.code,
			security: buildTwoFactorSecurityContext({ url, request, getClientAddress })
		});

		if (!result.ok) {
			if (result.reason === 'NO_PENDING_SETUP') {
				return message(form, TWO_FACTOR_SETUP_FAILED_MESSAGE, { status: 400 });
			}

			return message(form, TWO_FACTOR_INVALID_CODE_MESSAGE, { status: 400 });
		}

		return {
			confirmTotpForm: form,
			backupCodes: result.backupCodes ?? []
		};
	},

	sendSmsSetupCode: async ({ locals, url }) => {
		if (!locals.user) {
			return fail(401);
		}

		const result = await sendSetupOtpCode({ userId: locals.user.id, method: 'sms', origin: url.origin });

		if (!result.ok) {
			if (result.reason === 'ALREADY_ENABLED') {
				return fail(400, { error: TWO_FACTOR_ALREADY_ENABLED_MESSAGE });
			}

			if (result.reason === 'PHONE_NOT_VERIFIED') {
				return fail(400, { error: TWO_FACTOR_PHONE_REQUIRED_MESSAGE });
			}

			if (result.reason === 'SMS_NOT_CONFIGURED') {
				return fail(400, { error: TWO_FACTOR_SMS_NOT_CONFIGURED_MESSAGE });
			}

			return fail(500, { error: TWO_FACTOR_SEND_FAILED_MESSAGE });
		}

		return { sent: true, message: TWO_FACTOR_CODE_SENT_MESSAGE };
	},

	confirmSmsSetup: async ({ request, locals, url, getClientAddress }) => {
		const form = await superValidate(request, zod4(twoFactorSetupOtpConfirmSchema), {
			id: 'confirmSmsForm'
		});

		if (!locals.user) {
			return fail(401, { confirmSmsForm: form });
		}

		if (!form.valid) {
			return fail(400, { confirmSmsForm: form });
		}

		const result = await confirmSetupOtp({
			userId: locals.user.id,
			method: 'sms',
			code: form.data.code,
			security: buildTwoFactorSecurityContext({ url, request, getClientAddress })
		});

		if (!result.ok) {
			return message(form, TWO_FACTOR_INVALID_CODE_MESSAGE, { status: 400 });
		}

		return {
			confirmSmsForm: form,
			backupCodes: result.backupCodes ?? []
		};
	},

	sendEmailSetupCode: async ({ locals, url }) => {
		if (!locals.user) {
			return fail(401);
		}

		const result = await sendSetupOtpCode({ userId: locals.user.id, method: 'email', origin: url.origin });

		if (!result.ok) {
			if (result.reason === 'ALREADY_ENABLED') {
				return fail(400, { error: TWO_FACTOR_ALREADY_ENABLED_MESSAGE });
			}

			return fail(500, { error: TWO_FACTOR_SEND_FAILED_MESSAGE });
		}

		return { sent: true, message: TWO_FACTOR_CODE_SENT_MESSAGE };
	},

	confirmEmailSetup: async ({ request, locals, url, getClientAddress }) => {
		const form = await superValidate(request, zod4(twoFactorSetupOtpConfirmSchema), {
			id: 'confirmEmailForm'
		});

		if (!locals.user) {
			return fail(401, { confirmEmailForm: form });
		}

		if (!form.valid) {
			return fail(400, { confirmEmailForm: form });
		}

		const result = await confirmSetupOtp({
			userId: locals.user.id,
			method: 'email',
			code: form.data.code,
			security: buildTwoFactorSecurityContext({ url, request, getClientAddress })
		});

		if (!result.ok) {
			return message(form, TWO_FACTOR_INVALID_CODE_MESSAGE, { status: 400 });
		}

		return {
			confirmEmailForm: form,
			backupCodes: result.backupCodes ?? []
		};
	},

	disableTwoFactor: async ({ request, locals, cookies, url, getClientAddress }) => {
		const user = locals.user
			? await findUserById(locals.user.id)
			: null;

		const schema = user?.passwordHash
			? twoFactorDisableWithPasswordSchema
			: twoFactorDisableWithCodeSchema;

		const form = await superValidate(request, zod4(schema), {
			id: 'disableTwoFactorForm'
		});

		if (!locals.user) {
			return fail(401, { disableTwoFactorForm: form });
		}

		if (!form.valid) {
			return fail(400, { disableTwoFactorForm: form });
		}

		const result = await disableTwoFactor({
			userId: locals.user.id,
			password: form.data.password,
			code: form.data.code,
			method: form.data.method,
			cookies,
			security: buildTwoFactorSecurityContext({ url, request, getClientAddress })
		});

		if (!result.ok) {
			if (result.reason === 'PASSWORD_REQUIRED' || result.reason === 'CODE_REQUIRED') {
				return message(form, TWO_FACTOR_DISABLE_PASSWORD_REQUIRED_MESSAGE, { status: 400 });
			}

			if (result.reason === 'INVALID_PASSWORD') {
				return message(form, CURRENT_PASSWORD_INVALID_MESSAGE, { status: 400 });
			}

			if (result.reason === 'INVALID_CODE') {
				return message(form, TWO_FACTOR_INVALID_CODE_MESSAGE, { status: 400 });
			}

			if (result.reason === 'METHOD_NOT_ENABLED') {
				return message(form, TWO_FACTOR_SETUP_FAILED_MESSAGE, { status: 400 });
			}

			return message(form, TWO_FACTOR_SETUP_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, TWO_FACTOR_DISABLED_MESSAGE);
	},

	regenerateBackupCodes: async ({ request, locals }) => {
		const user = locals.user ? await findUserById(locals.user.id) : null;

		const schema = user?.passwordHash
			? twoFactorRegenerateBackupCodesWithPasswordSchema
			: twoFactorRegenerateBackupCodesWithCodeSchema;

		const form = await superValidate(request, zod4(schema), {
			id: 'regenerateBackupCodesForm'
		});

		if (!locals.user) {
			return fail(401, { regenerateBackupCodesForm: form });
		}

		if (!form.valid) {
			return fail(400, { regenerateBackupCodesForm: form });
		}

		const verification = await verifySensitiveActionIdentity({
			userId: locals.user.id,
			password: form.data.password,
			code: form.data.code,
			method: 'totp',
			allowBackupCode: false
		});

		if (!verification.ok) {
			if (verification.reason === 'PASSWORD_REQUIRED' || verification.reason === 'CODE_REQUIRED') {
				return message(form, TWO_FACTOR_DISABLE_PASSWORD_REQUIRED_MESSAGE, { status: 400 });
			}

			if (verification.reason === 'INVALID_PASSWORD') {
				return message(form, CURRENT_PASSWORD_INVALID_MESSAGE, { status: 400 });
			}

			if (verification.reason === 'INVALID_CODE') {
				return message(form, TWO_FACTOR_INVALID_CODE_MESSAGE, { status: 400 });
			}

			return message(form, TWO_FACTOR_SETUP_FAILED_MESSAGE, { status: 400 });
		}

		const result = await regenerateUserBackupCodes(locals.user.id);

		if (!result.ok) {
			return message(form, TWO_FACTOR_SETUP_FAILED_MESSAGE, { status: 500 });
		}

		return {
			regenerateBackupCodesForm: form,
			backupCodes: result.backupCodes,
			message: TWO_FACTOR_BACKUP_CODES_REGENERATED_MESSAGE
		};
	},

	revokeTrustedDevice: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401);
		}

		const formData = await request.formData();
		const deviceId = formData.get('deviceId')?.toString() ?? '';

		if (!deviceId) {
			return fail(400, { error: 'Device id is required' });
		}

		await removeTrustedDevice(locals.user.id, deviceId);

		return { ok: true, message: TWO_FACTOR_TRUSTED_DEVICE_REVOKED_MESSAGE };
	}
};
