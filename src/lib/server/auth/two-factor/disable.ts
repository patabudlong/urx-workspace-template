import { verifyPassword } from '$lib/server/auth/password';
import { disableTwoFactorForUser, isTwoFactorEnabled } from '$lib/server/repositories/user-two-factor';
import { findUserById } from '$lib/server/repositories/users';
import { clearTrustedDeviceCookie } from '$lib/server/auth/two-factor/trusted-devices';
import type { Cookies } from '@sveltejs/kit';

export async function disableTwoFactorWithPassword(input: {
	userId: string;
	password: string;
	cookies: Cookies;
}): Promise<
	| { ok: true }
	| {
			ok: false;
			reason: 'USER_NOT_FOUND' | 'TWO_FACTOR_DISABLED' | 'INVALID_PASSWORD' | 'PASSWORD_REQUIRED';
	  }
> {
	const user = await findUserById(input.userId);

	if (!user) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	if (!isTwoFactorEnabled(user)) {
		return { ok: false, reason: 'TWO_FACTOR_DISABLED' };
	}

	if (!user.passwordHash) {
		return { ok: false, reason: 'PASSWORD_REQUIRED' };
	}

	const passwordValid = await verifyPassword(input.password, user.passwordHash);

	if (!passwordValid) {
		return { ok: false, reason: 'INVALID_PASSWORD' };
	}

	const disabled = await disableTwoFactorForUser(input.userId);

	if (!disabled) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	clearTrustedDeviceCookie(input.cookies);

	return { ok: true };
}
