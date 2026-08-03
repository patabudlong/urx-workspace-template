import { verifyPassword } from '$lib/server/auth/password';
import { looksLikeBackupCode, verifyBackupCode } from '$lib/server/auth/two-factor/backup-codes';
import { decryptTotpSecret, verifyTotpCode } from '$lib/server/auth/two-factor/totp';
import { getUserTwoFactor } from '$lib/server/repositories/user-two-factor';
import { findUserById } from '$lib/server/repositories/users';
import type { UserDocument } from '$lib/shared/models/user';
import { TWO_FACTOR_METHODS } from '$lib/shared/models/two-factor';

export type SensitiveActionVerificationMethod = 'totp' | 'backup';

export async function verifySensitiveActionIdentity(input: {
	userId: string;
	password?: string;
	code?: string;
	method?: SensitiveActionVerificationMethod;
	allowBackupCode?: boolean;
}): Promise<
	| { ok: true; user: UserDocument }
	| {
			ok: false;
			reason:
				| 'USER_NOT_FOUND'
				| 'PASSWORD_REQUIRED'
				| 'CODE_REQUIRED'
				| 'INVALID_PASSWORD'
				| 'INVALID_CODE'
				| 'METHOD_NOT_ENABLED';
	  }
> {
	const user = await findUserById(input.userId);

	if (!user) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	if (user.passwordHash) {
		if (!input.password) {
			return { ok: false, reason: 'PASSWORD_REQUIRED' };
		}

		const passwordValid = await verifyPassword(input.password, user.passwordHash);

		if (!passwordValid) {
			return { ok: false, reason: 'INVALID_PASSWORD' };
		}

		return { ok: true, user };
	}

	if (!input.code?.trim()) {
		return { ok: false, reason: 'CODE_REQUIRED' };
	}

	const twoFactor = getUserTwoFactor(user);
	const normalizedCode = input.code.trim();
	const method = resolveSensitiveActionMethod({
		requestedMethod: input.method,
		code: normalizedCode,
		totpEnabled: Boolean(twoFactor.methods.totp),
		allowBackupCode: input.allowBackupCode ?? false
	});

	if (method === 'totp') {
		if (!twoFactor.methods.totp) {
			return { ok: false, reason: 'METHOD_NOT_ENABLED' };
		}

		const secret = decryptTotpSecret(twoFactor.methods.totp.secretEncrypted);
		const verified = await verifyTotpCode(secret, normalizedCode);

		if (!verified) {
			return { ok: false, reason: 'INVALID_CODE' };
		}

		return { ok: true, user };
	}

	if (!input.allowBackupCode) {
		return { ok: false, reason: 'METHOD_NOT_ENABLED' };
	}

	if (!verifyBackupCode(normalizedCode, twoFactor.backupCodeHashes)) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	return { ok: true, user };
}

function resolveSensitiveActionMethod(input: {
	requestedMethod?: SensitiveActionVerificationMethod;
	code: string;
	totpEnabled: boolean;
	allowBackupCode: boolean;
}): SensitiveActionVerificationMethod {
	if (input.allowBackupCode && looksLikeBackupCode(input.code)) {
		return TWO_FACTOR_METHODS.BACKUP;
	}

	if (input.requestedMethod === 'backup' && input.allowBackupCode) {
		return 'backup';
	}

	if (input.requestedMethod === 'totp' && input.totpEnabled) {
		return 'totp';
	}

	if (input.totpEnabled) {
		return TWO_FACTOR_METHODS.TOTP;
	}

	return TWO_FACTOR_METHODS.BACKUP;
}

export function defaultSensitiveActionMethod(user: UserDocument): SensitiveActionVerificationMethod {
	const twoFactor = getUserTwoFactor(user);

	if (twoFactor.methods.totp) {
		return TWO_FACTOR_METHODS.TOTP;
	}

	return TWO_FACTOR_METHODS.BACKUP;
}
