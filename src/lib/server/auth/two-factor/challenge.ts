import { createHash, randomInt } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { signTwoFactorPendingToken } from '$lib/server/auth/jwt';
import { createAuthSession, type AuthSession } from '$lib/server/auth/session-user';
import { TWO_FACTOR_PENDING_TTL_SECONDS } from '$lib/server/auth/session';
import {
	removeUsedBackupCodeHash,
	verifyBackupCode
} from '$lib/server/auth/two-factor/backup-codes';
import {
	createTrustedDeviceRecord,
	isTrustedDeviceValid,
	parseTrustedDeviceCookie,
	TRUSTED_DEVICE_COOKIE_NAME
} from '$lib/server/auth/two-factor/trusted-devices';
import { decryptTotpSecret, verifyTotpCode } from '$lib/server/auth/two-factor/totp';
import { sendTwoFactorEmailCode } from '$lib/server/mail/two-factor-code';
import { isSmsConfigured, sendSms } from '$lib/server/sms/index';
import {
	createTwoFactorOtpToken,
	ensureTwoFactorOtpTokenIndexes,
	findValidTwoFactorOtpToken,
	markTwoFactorOtpTokenUsed,
	TWO_FACTOR_OTP_PURPOSES,
	type TwoFactorOtpPurpose
} from '$lib/server/repositories/two-factor-otp-tokens';
import {
	addTrustedDevice,
	consumeBackupCode,
	getEnabledTwoFactorMethods,
	getUserTwoFactor,
	isTwoFactorEnabled
} from '$lib/server/repositories/user-two-factor';
import { findUserById, isUserPhoneVerified } from '$lib/server/repositories/users';
import type { UserDocument } from '$lib/shared/models/user';
import { TWO_FACTOR_METHODS, type TwoFactorMethod } from '$lib/shared/models/two-factor';

export const TWO_FACTOR_PENDING_COOKIE_NAME = 'urx_2fa_pending';

const OTP_TTL_MS = 15 * 60 * 1000;

function hashOtpCode(code: string): string {
	return createHash('sha256').update(code).digest('hex');
}

function createOtpCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function buildSmsBody(code: string): string {
	return `Your Urixoft sign-in code is ${code}. It expires in 15 minutes.`;
}

export function getTwoFactorPendingCookieOptions(): {
	path: string;
	httpOnly: boolean;
	sameSite: 'lax';
	secure: boolean;
	maxAge: number;
} {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: TWO_FACTOR_PENDING_TTL_SECONDS
	};
}

export async function shouldChallengeTwoFactor(
	user: UserDocument,
	cookies?: Cookies
): Promise<boolean> {
	if (!isTwoFactorEnabled(user)) {
		return false;
	}

	if (!cookies) {
		return true;
	}

	const cookiePayload = parseTrustedDeviceCookie(cookies.get(TRUSTED_DEVICE_COOKIE_NAME));
	const twoFactor = getUserTwoFactor(user);

	return !isTrustedDeviceValid(twoFactor.trustedDevices, cookiePayload);
}

export async function createTwoFactorPendingChallenge(user: UserDocument): Promise<string> {
	return signTwoFactorPendingToken({
		sub: user._id.toString(),
		email: user.email
	});
}

export type AuthSessionOrChallenge =
	| { status: 'session'; session: AuthSession }
	| { status: 'two_factor_required'; pendingToken: string; methods: TwoFactorMethod[] };

export async function resolveAuthSessionOrChallenge(
	user: UserDocument,
	cookies?: Cookies
): Promise<AuthSessionOrChallenge> {
	if (await shouldChallengeTwoFactor(user, cookies)) {
		return {
			status: 'two_factor_required',
			pendingToken: await createTwoFactorPendingChallenge(user),
			methods: getEnabledTwoFactorMethods(user)
		};
	}

	return {
		status: 'session',
		session: await createAuthSession(user)
	};
}

export async function sendTwoFactorLoginCode(input: {
	userId: string;
	method: 'sms' | 'email';
	origin: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'USER_NOT_FOUND' | 'METHOD_NOT_ENABLED' | 'SMS_NOT_CONFIGURED' | 'SEND_FAILED' }
> {
	await ensureTwoFactorOtpTokenIndexes();

	const user = await findUserById(input.userId);

	if (!user || !isTwoFactorEnabled(user)) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	const twoFactor = getUserTwoFactor(user);

	if (input.method === 'sms') {
		if (!twoFactor.methods.sms || !user.phoneNumber || !isUserPhoneVerified(user)) {
			return { ok: false, reason: 'METHOD_NOT_ENABLED' };
		}

		if (!(await isSmsConfigured())) {
			return { ok: false, reason: 'SMS_NOT_CONFIGURED' };
		}
	} else if (!twoFactor.methods.email) {
		return { ok: false, reason: 'METHOD_NOT_ENABLED' };
	}

	const code = createOtpCode();
	const purpose: TwoFactorOtpPurpose =
		input.method === 'sms' ? TWO_FACTOR_OTP_PURPOSES.LOGIN_SMS : TWO_FACTOR_OTP_PURPOSES.LOGIN_EMAIL;

	await createTwoFactorOtpToken({
		userId: input.userId,
		purpose,
		tokenHash: hashOtpCode(code),
		expiresAt: new Date(Date.now() + OTP_TTL_MS)
	});

	try {
		if (input.method === 'sms') {
			await sendSms({ to: user.phoneNumber!, body: buildSmsBody(code) });
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

export async function verifyTwoFactorChallenge(input: {
	userId: string;
	code: string;
	method: TwoFactorMethod;
	rememberDevice?: boolean;
	deviceLabel?: string;
}): Promise<
	| { ok: true; session: AuthSession; trustedDevice?: { deviceId: string; token: string } }
	| { ok: false; reason: 'INVALID_CODE' | 'USER_NOT_FOUND' | 'METHOD_NOT_ENABLED' }
> {
	const user = await findUserById(input.userId);

	if (!user || !isTwoFactorEnabled(user)) {
		return { ok: false, reason: 'USER_NOT_FOUND' };
	}

	const twoFactor = getUserTwoFactor(user);
	const normalizedCode = input.code.trim();
	let verified = false;

	if (input.method === TWO_FACTOR_METHODS.TOTP) {
		if (!twoFactor.methods.totp) {
			return { ok: false, reason: 'METHOD_NOT_ENABLED' };
		}

		const secret = decryptTotpSecret(twoFactor.methods.totp.secretEncrypted);
		verified = await verifyTotpCode(secret, normalizedCode);
	} else if (input.method === TWO_FACTOR_METHODS.SMS) {
		if (!twoFactor.methods.sms) {
			return { ok: false, reason: 'METHOD_NOT_ENABLED' };
		}

		const token = await findValidTwoFactorOtpToken({
			userId: input.userId,
			purpose: TWO_FACTOR_OTP_PURPOSES.LOGIN_SMS,
			tokenHash: hashOtpCode(normalizedCode)
		});

		if (token) {
			await markTwoFactorOtpTokenUsed(token._id);
			verified = true;
		}
	} else if (input.method === TWO_FACTOR_METHODS.EMAIL) {
		if (!twoFactor.methods.email) {
			return { ok: false, reason: 'METHOD_NOT_ENABLED' };
		}

		const token = await findValidTwoFactorOtpToken({
			userId: input.userId,
			purpose: TWO_FACTOR_OTP_PURPOSES.LOGIN_EMAIL,
			tokenHash: hashOtpCode(normalizedCode)
		});

		if (token) {
			await markTwoFactorOtpTokenUsed(token._id);
			verified = true;
		}
	} else if (input.method === TWO_FACTOR_METHODS.BACKUP) {
		if (verifyBackupCode(normalizedCode, twoFactor.backupCodeHashes)) {
			const remaining = removeUsedBackupCodeHash(twoFactor.backupCodeHashes, normalizedCode);
			await consumeBackupCode(input.userId, normalizedCode, remaining);
			verified = true;
		}
	}

	if (!verified) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	const session = await createAuthSession(user);
	let trustedDevice: { deviceId: string; token: string } | undefined;

	if (input.rememberDevice) {
		const created = createTrustedDeviceRecord({ label: input.deviceLabel });
		await addTrustedDevice(input.userId, created.device);
		trustedDevice = { deviceId: created.device.id, token: created.token };
	}

	return { ok: true, session, trustedDevice };
}
