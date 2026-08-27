import { createHash, randomInt } from 'node:crypto';
import { generateBackupCodes } from '$lib/server/auth/two-factor/backup-codes';
import {
	createTotpSecret,
	createTotpQrDataUrl,
	encryptTotpSecret,
	buildTotpUri,
	verifyTotpCode,
	decryptTotpSecret
} from '$lib/server/auth/two-factor/totp';
import {
	sendTwoFactorEmailCode,
	trySendTwoFactorStatusEmail,
	type TwoFactorSecurityContext
} from '$lib/server/mail/two-factor-email';
import { buildTwoFactorOtpSmsBody } from '$lib/shared/two-factor-otp-message';
import { isSmsConfigured, sendSms } from '$lib/server/sms/index';
import {
	createTwoFactorOtpToken,
	ensureTwoFactorOtpTokenIndexes,
	findValidTwoFactorOtpToken,
	markTwoFactorOtpTokenUsed,
	TWO_FACTOR_OTP_PURPOSES
} from '$lib/server/repositories/two-factor-otp-tokens';
import {
	clearPendingTotpSecret,
	enableEmailTwoFactorMethod,
	enableSmsTwoFactorMethod,
	enableTotpMethod,
	getUserTwoFactor,
	regenerateBackupCodes as persistBackupCodes,
	setPendingTotpSecret
} from '$lib/server/repositories/user-two-factor';
import {
	consumeTwoFactorOtpSend,
	getTwoFactorOtpSendRetryAfterSeconds,
	isTwoFactorOtpSendThrottled
} from '$lib/server/security/two-factor-otp-rate-limit';
import { findUserById, isUserPhoneVerified } from '$lib/server/repositories/users';
import { isTwoFactorSmsSetupAvailable } from '$lib/shared/two-factor-availability';
import { TWO_FACTOR_METHODS } from '$lib/shared/models/two-factor';
import type { UserDocument } from '$lib/shared/models/user';

const OTP_TTL_MS = 15 * 60 * 1000;

function hashOtpCode(code: string): string {
	return createHash('sha256').update(code).digest('hex');
}

function createOtpCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function shouldIssueBackupCodes(user: UserDocument): boolean {
	const twoFactor = getUserTwoFactor(user);

	return twoFactor.backupCodeHashes.length === 0;
}

export async function startTotpSetup(userId: string): Promise<
	| { ok: true; qrDataUrl: string; manualKey: string }
	| { ok: false; reason: 'USER_NOT_FOUND' | 'ALREADY_ENABLED' }
> {
	const user = await findUserById(userId);

	if (!user) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	const twoFactor = getUserTwoFactor(user);

	if (twoFactor.methods.totp) {
		return { ok: false, reason: 'ALREADY_ENABLED' };
	}

	const secret = createTotpSecret();
	const secretEncrypted = encryptTotpSecret(secret);
	await setPendingTotpSecret(userId, secretEncrypted);

	const otpauthUri = buildTotpUri({ email: user.email, secret });
	const qrDataUrl = await createTotpQrDataUrl(otpauthUri);

	return { ok: true, qrDataUrl, manualKey: secret };
}

export async function confirmTotpSetup(input: {
	userId: string;
	code: string;
	security?: TwoFactorSecurityContext;
}): Promise<
	| { ok: true; backupCodes?: string[] }
	| { ok: false; reason: 'USER_NOT_FOUND' | 'NO_PENDING_SETUP' | 'INVALID_CODE' }
> {
	const user = await findUserById(input.userId);

	if (!user) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	const pendingEncrypted = user.twoFactor?.pendingTotpSecretEncrypted;

	if (!pendingEncrypted) {
		return { ok: false, reason: 'NO_PENDING_SETUP' };
	}

	const secret = decryptTotpSecret(pendingEncrypted);
	const valid = await verifyTotpCode(secret, input.code);

	if (!valid) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	let backupCodes: string[] | undefined;
	let backupCodeHashes: string[] | undefined;

	if (shouldIssueBackupCodes(user)) {
		const generated = generateBackupCodes();
		backupCodes = generated.codes;
		backupCodeHashes = generated.hashes;
	}

	const enabled = await enableTotpMethod(input.userId, {
		secretEncrypted: pendingEncrypted,
		backupCodeHashes
	});

	if (!enabled) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	await clearPendingTotpSecret(input.userId);

	await trySendTwoFactorStatusEmail({
		to: user.email,
		firstName: user.firstName,
		change: 'enabled',
		method: TWO_FACTOR_METHODS.TOTP,
		changedAt: new Date(),
		security: input.security
	});

	return { ok: true, backupCodes };
}

export async function sendSetupOtpCode(input: {
	userId: string;
	method: 'sms' | 'email';
	origin: string;
	clientIp?: string;
}): Promise<
	| { ok: true }
	| {
			ok: false;
			reason:
				| 'USER_NOT_FOUND'
				| 'ALREADY_ENABLED'
				| 'PHONE_NOT_VERIFIED'
				| 'SMS_NOT_CONFIGURED'
				| 'SMS_SETUP_UNAVAILABLE'
				| 'SEND_FAILED'
				| 'THROTTLED';
			retryAfterSeconds?: number;
	  }
> {
	await ensureTwoFactorOtpTokenIndexes();

	const user = await findUserById(input.userId);

	if (!user) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	const twoFactor = getUserTwoFactor(user);

	if (input.method === 'sms') {
		if (!isTwoFactorSmsSetupAvailable()) {
			return { ok: false, reason: 'SMS_SETUP_UNAVAILABLE' };
		}

		if (twoFactor.methods.sms) {
			return { ok: false, reason: 'ALREADY_ENABLED' };
		}

		if (!user.phoneNumber || !isUserPhoneVerified(user)) {
			return { ok: false, reason: 'PHONE_NOT_VERIFIED' };
		}

		if (!(await isSmsConfigured())) {
			return { ok: false, reason: 'SMS_NOT_CONFIGURED' };
		}
	} else if (twoFactor.methods.email) {
		return { ok: false, reason: 'ALREADY_ENABLED' };
	}

	if (
		isTwoFactorOtpSendThrottled({
			userId: input.userId,
			method: input.method,
			phoneNumber: input.method === 'sms' ? user.phoneNumber ?? undefined : undefined,
			clientIp: input.clientIp
		})
	) {
		return {
			ok: false,
			reason: 'THROTTLED',
			retryAfterSeconds: getTwoFactorOtpSendRetryAfterSeconds({
				userId: input.userId,
				method: input.method,
				phoneNumber: input.method === 'sms' ? user.phoneNumber ?? undefined : undefined,
				clientIp: input.clientIp
			})
		};
	}

	const code = createOtpCode();
	const purpose =
		input.method === 'sms'
			? TWO_FACTOR_OTP_PURPOSES.SETUP_SMS
			: TWO_FACTOR_OTP_PURPOSES.SETUP_EMAIL;

	await createTwoFactorOtpToken({
		userId: input.userId,
		purpose,
		tokenHash: hashOtpCode(code),
		expiresAt: new Date(Date.now() + OTP_TTL_MS)
	});

	const rateLimit = consumeTwoFactorOtpSend({
		userId: input.userId,
		method: input.method,
		phoneNumber: input.method === 'sms' ? user.phoneNumber ?? undefined : undefined,
		clientIp: input.clientIp
	});

	if (!rateLimit.ok) {
		return {
			ok: false,
			reason: 'THROTTLED',
			retryAfterSeconds: rateLimit.retryAfterSeconds
		};
	}

	try {
		if (input.method === 'sms') {
			await sendSms({ to: user.phoneNumber!, body: buildTwoFactorOtpSmsBody(code) });
		} else {
			await sendTwoFactorEmailCode({
				email: user.email,
				firstName: user.firstName,
				code,
				origin: input.origin
			});
		}
	} catch {
		return { ok: false, reason: 'SEND_FAILED' };
	}

	return { ok: true };
}

export async function confirmSetupOtp(input: {
	userId: string;
	method: 'sms' | 'email';
	code: string;
	security?: TwoFactorSecurityContext;
}): Promise<
	| { ok: true; backupCodes?: string[] }
	| { ok: false; reason: 'USER_NOT_FOUND' | 'INVALID_CODE' }
> {
	const user = await findUserById(input.userId);

	if (!user) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	const purpose =
		input.method === 'sms'
			? TWO_FACTOR_OTP_PURPOSES.SETUP_SMS
			: TWO_FACTOR_OTP_PURPOSES.SETUP_EMAIL;

	const token = await findValidTwoFactorOtpToken({
		userId: input.userId,
		purpose,
		tokenHash: hashOtpCode(input.code.trim())
	});

	if (!token) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	await markTwoFactorOtpTokenUsed(token._id);

	let backupCodes: string[] | undefined;
	let backupCodeHashes: string[] | undefined;

	if (shouldIssueBackupCodes(user)) {
		const generated = generateBackupCodes();
		backupCodes = generated.codes;
		backupCodeHashes = generated.hashes;
	}

	if (input.method === 'sms') {
		await enableSmsTwoFactorMethod(input.userId);
	} else {
		await enableEmailTwoFactorMethod(input.userId);
	}

	if (backupCodeHashes) {
		await persistBackupCodes(input.userId, backupCodeHashes);
	}

	await trySendTwoFactorStatusEmail({
		to: user.email,
		firstName: user.firstName,
		change: 'enabled',
		method: input.method === 'sms' ? TWO_FACTOR_METHODS.SMS : TWO_FACTOR_METHODS.EMAIL,
		changedAt: new Date(),
		security: input.security
	});

	return { ok: true, backupCodes };
}

export async function regenerateUserBackupCodes(userId: string): Promise<
	| { ok: true; backupCodes: string[] }
	| { ok: false; reason: 'USER_NOT_FOUND' | 'TWO_FACTOR_DISABLED' }
> {
	const user = await findUserById(userId);

	if (!user || !user.twoFactor?.enabled) {
		return { ok: false, reason: 'TWO_FACTOR_DISABLED' };
	}

	const generated = generateBackupCodes();
	const saved = await persistBackupCodes(userId, generated.hashes);

	if (!saved) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	return { ok: true, backupCodes: generated.codes };
}
