import { createHash, randomInt } from 'node:crypto';
import { isSmsConfigured, sendSms } from '$lib/server/sms/index';
import {
	createPhoneVerificationToken,
	ensurePhoneVerificationTokenIndexes,
	findValidPhoneVerificationTokenForUser,
	markPhoneVerificationTokenUsed
} from '$lib/server/repositories/phone-verification-tokens';
import {
	ensureUserIndexes,
	findUserById,
	findUserByPhoneNumber,
	isUserPhoneVerified,
	markUserPhoneVerified,
	updateUserPhoneNumber
} from '$lib/server/repositories/users';
import {
	consumeVerificationSmsSend,
	getVerificationSmsRetryAfterSeconds,
	isVerificationSmsThrottled
} from '$lib/server/security/phone-sms-rate-limit';

const CODE_TTL_MS = 15 * 60 * 1000;

function hashVerificationCode(code: string): string {
	return createHash('sha256').update(code).digest('hex');
}

function createVerificationCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function buildVerificationSmsBody(code: string): string {
	return `Your Urixoft verification code is ${code}. It expires in 15 minutes.`;
}

export type PreparePhoneVerificationSmsResult =
	| { ok: true; status: 'send_pending'; to: string; body: string }
	| { ok: true; status: 'skipped' }
	| { ok: true; status: 'throttled'; retryAfterSeconds: number }
	| { ok: false; reason: 'SMS_NOT_CONFIGURED' };

async function preparePhoneVerificationSms(input: {
	userId: string;
	phoneNumber: string;
}): Promise<PreparePhoneVerificationSmsResult> {
	await Promise.all([ensureUserIndexes(), ensurePhoneVerificationTokenIndexes()]);

	if (!(await isSmsConfigured())) {
		return { ok: false, reason: 'SMS_NOT_CONFIGURED' };
	}

	const user = await findUserById(input.userId);

	if (!user || !user.phoneNumber || user.phoneNumber !== input.phoneNumber) {
		return { ok: true, status: 'skipped' };
	}

	if (isUserPhoneVerified(user)) {
		return { ok: true, status: 'skipped' };
	}

	if (isVerificationSmsThrottled({ phoneNumber: input.phoneNumber, userId: input.userId })) {
		return {
			ok: true,
			status: 'throttled',
			retryAfterSeconds: getVerificationSmsRetryAfterSeconds({
				phoneNumber: input.phoneNumber,
				userId: input.userId
			})
		};
	}

	const code = createVerificationCode();
	const expiresAt = new Date(Date.now() + CODE_TTL_MS);

	await createPhoneVerificationToken({
		userId: input.userId,
		phoneNumber: input.phoneNumber,
		tokenHash: hashVerificationCode(code),
		expiresAt
	});

	const smsRateLimit = consumeVerificationSmsSend({
		phoneNumber: input.phoneNumber,
		userId: input.userId
	});

	if (!smsRateLimit.ok) {
		return {
			ok: true,
			status: 'throttled',
			retryAfterSeconds: smsRateLimit.retryAfterSeconds
		};
	}

	return {
		ok: true,
		status: 'send_pending',
		to: input.phoneNumber,
		body: buildVerificationSmsBody(code)
	};
}

export async function queuePhoneVerificationSmsForWeb(input: {
	userId: string;
	phoneNumber: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'SMS_NOT_CONFIGURED' }
	| { ok: false; reason: 'SEND_FAILED' }
	| { ok: false; reason: 'THROTTLED'; retryAfterSeconds: number }
> {
	const prepared = await preparePhoneVerificationSms(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'skipped') {
		return { ok: true };
	}

	if (prepared.status === 'throttled') {
		return { ok: false, reason: 'THROTTLED', retryAfterSeconds: prepared.retryAfterSeconds };
	}

	try {
		await sendSms({
			to: prepared.to,
			body: prepared.body
		});
	} catch (error) {
		console.error('Failed to send verification SMS', error);
		return { ok: false, reason: 'SEND_FAILED' };
	}

	return { ok: true };
}

export async function updateUserPhoneNumberForWeb(input: {
	userId: string;
	phoneNumber: string | null;
}): Promise<
	| { ok: true; phoneNumber: string | null; verificationQueued: boolean }
	| {
			ok: true;
			phoneNumber: string;
			verificationQueued: false;
			smsThrottled: true;
			retryAfterSeconds: number;
	  }
	| { ok: false; reason: 'PHONE_IN_USE' }
	| { ok: false; reason: 'UPDATE_FAILED' }
> {
	await ensureUserIndexes();

	if (input.phoneNumber) {
		const existing = await findUserByPhoneNumber(input.phoneNumber);

		if (existing && existing._id.toString() !== input.userId) {
			return { ok: false, reason: 'PHONE_IN_USE' };
		}
	}

	const updated = await updateUserPhoneNumber(input.userId, input.phoneNumber);

	if (!updated) {
		return { ok: false, reason: 'UPDATE_FAILED' };
	}

	if (!input.phoneNumber) {
		return { ok: true, phoneNumber: null, verificationQueued: false };
	}

	const smsResult = await queuePhoneVerificationSmsForWeb({
		userId: input.userId,
		phoneNumber: input.phoneNumber
	});

	if (!smsResult.ok && smsResult.reason === 'THROTTLED') {
		return {
			ok: true,
			phoneNumber: input.phoneNumber,
			verificationQueued: false,
			smsThrottled: true,
			retryAfterSeconds: smsResult.retryAfterSeconds
		};
	}

	return {
		ok: true,
		phoneNumber: input.phoneNumber,
		verificationQueued: smsResult.ok
	};
}

export async function verifyPhoneWithCode(input: {
	userId: string;
	code: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'INVALID_CODE' }
	| { ok: false; reason: 'ALREADY_VERIFIED' }
	| { ok: false; reason: 'NO_PHONE' }
	| { ok: false; reason: 'UPDATE_FAILED' }
> {
	const code = input.code.trim();

	if (!/^\d{6}$/.test(code)) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	await Promise.all([ensureUserIndexes(), ensurePhoneVerificationTokenIndexes()]);

	const user = await findUserById(input.userId);

	if (!user?.phoneNumber) {
		return { ok: false, reason: 'NO_PHONE' };
	}

	if (isUserPhoneVerified(user)) {
		return { ok: false, reason: 'ALREADY_VERIFIED' };
	}

	const record = await findValidPhoneVerificationTokenForUser(
		input.userId,
		user.phoneNumber,
		hashVerificationCode(code)
	);

	if (!record) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	const updated = await markUserPhoneVerified(input.userId);

	if (!updated) {
		return { ok: false, reason: 'UPDATE_FAILED' };
	}

	await markPhoneVerificationTokenUsed(record._id.toString());

	return { ok: true };
}
