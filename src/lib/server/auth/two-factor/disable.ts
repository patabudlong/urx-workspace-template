import {
	disableTwoFactorForUser,
	isTwoFactorEnabled
} from '$lib/server/repositories/user-two-factor';
import { clearTrustedDeviceCookie } from '$lib/server/auth/two-factor/trusted-devices';
import {
	defaultSensitiveActionMethod,
	verifySensitiveActionIdentity,
	type SensitiveActionVerificationMethod
} from '$lib/server/auth/two-factor/verify-identity';
import type { Cookies } from '@sveltejs/kit';

export async function disableTwoFactor(input: {
	userId: string;
	password?: string;
	code?: string;
	method?: SensitiveActionVerificationMethod;
	cookies: Cookies;
}): Promise<
	| { ok: true }
	| {
			ok: false;
			reason:
				| 'USER_NOT_FOUND'
				| 'TWO_FACTOR_DISABLED'
				| 'PASSWORD_REQUIRED'
				| 'CODE_REQUIRED'
				| 'INVALID_PASSWORD'
				| 'INVALID_CODE'
				| 'METHOD_NOT_ENABLED';
	  }
> {
	const verification = await verifySensitiveActionIdentity({
		userId: input.userId,
		password: input.password,
		code: input.code,
		method: input.method ?? undefined,
		allowBackupCode: true
	});

	if (!verification.ok) {
		return { ok: false, reason: verification.reason };
	}

	if (!isTwoFactorEnabled(verification.user)) {
		return { ok: false, reason: 'TWO_FACTOR_DISABLED' };
	}

	const disabled = await disableTwoFactorForUser(input.userId);

	if (!disabled) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	clearTrustedDeviceCookie(input.cookies);

	return { ok: true };
}
