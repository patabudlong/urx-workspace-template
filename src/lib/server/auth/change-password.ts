import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { matchesStoredPassword } from '$lib/server/auth/password-history';
import { findUserById, rotateUserPassword } from '$lib/server/repositories/users';
import { recordPasswordChanged } from '$lib/server/security/record-security-event';
import { isPasswordStrong } from '$lib/shared/password-policy';

export async function changePasswordForUser(input: {
	userId: string;
	currentPassword: string;
	newPassword: string;
	origin?: string;
	ipAddress?: string;
	userAgent?: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'NO_APP_PASSWORD' }
	| { ok: false; reason: 'INVALID_CURRENT_PASSWORD' }
	| { ok: false; reason: 'WEAK_PASSWORD' }
	| { ok: false; reason: 'PASSWORD_REUSED' }
	| { ok: false; reason: 'UPDATE_FAILED' }
> {
	const user = await findUserById(input.userId);

	if (!user?.passwordHash) {
		return { ok: false, reason: 'NO_APP_PASSWORD' };
	}

	if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
		return { ok: false, reason: 'INVALID_CURRENT_PASSWORD' };
	}

	if (!isPasswordStrong(input.newPassword)) {
		return { ok: false, reason: 'WEAK_PASSWORD' };
	}

	if (
		await matchesStoredPassword(
			input.newPassword,
			user.passwordHash,
			user.passwordHistory ?? []
		)
	) {
		return { ok: false, reason: 'PASSWORD_REUSED' };
	}

	const passwordHash = await hashPassword(input.newPassword);
	const updated = await rotateUserPassword(input.userId, {
		newPasswordHash: passwordHash,
		currentPasswordHash: user.passwordHash,
		passwordHistory: user.passwordHistory
	});

	if (!updated) {
		return { ok: false, reason: 'UPDATE_FAILED' };
	}

	await recordPasswordChanged({
		userId: input.userId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		origin: input.origin
	});

	return { ok: true };
}
