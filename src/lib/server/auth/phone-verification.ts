import { env } from '$env/dynamic/private';
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
import { isAuthRateLimitEnabled } from '$lib/server/security/auth-rate-limit';

const CODE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_VERIFICATION_SMS_MAX_ATTEMPTS = 3;
const DEFAULT_VERIFICATION_SMS_WINDOW_SECONDS = 3600;

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function hashVerificationCode(code: string): string {
	return createHash('sha256').update(code).digest('hex');
}

function createVerificationCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function getVerificationSmsMaxAttempts(): number {
	const configured = Number(env.AUTH_VERIFICATION_SMS_MAX);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured);
	}

	return DEFAULT_VERIFICATION_SMS_MAX_ATTEMPTS;
}

function getVerificationSmsWindowMs(): number {
	const configured = Number(env.AUTH_VERIFICATION_SMS_WINDOW_SECONDS);

	if (Number.isFinite(configured) && configured > 0) {
		return Math.floor(configured) * 1000;
	}

	return DEFAULT_VERIFICATION_SMS_WINDOW_SECONDS * 1000;
}

function verificationSmsRateLimitKey(phoneNumber: string): string {
	return `verify-sms:${phoneNumber}`;
}

function isVerificationSmsThrottled(phoneNumber: string): boolean {
	if (!isAuthRateLimitEnabled()) {
		return false;
	}

	const key = verificationSmsRateLimitKey(phoneNumber);
	const entry = store.get(key);
	const now = Date.now();

	if (!entry || entry.resetAt <= now) {
		return false;
	}

	return entry.count >= getVerificationSmsMaxAttempts();
}

function consumeVerificationSmsSend(phoneNumber: string): boolean {
	if (!isAuthRateLimitEnabled()) {
		return true;
	}

	const key = verificationSmsRateLimitKey(phoneNumber);
	const now = Date.now();
	const windowMs = getVerificationSmsWindowMs();
	const maxAttempts = getVerificationSmsMaxAttempts();
	let entry = store.get(key);

	if (!entry || entry.resetAt <= now) {
		entry = { count: 1, resetAt: now + windowMs };
		store.set(key, entry);
		return true;
	}

	entry.count += 1;

	return entry.count <= maxAttempts;
}

function buildVerificationSmsBody(code: string): string {
	return `Your Urixoft verification code is ${code}. It expires in 15 minutes.`;
}

export type PreparePhoneVerificationSmsResult =
	| { ok: true; status: 'send_pending'; to: string; body: string }
	| { ok: true; status: 'skipped' }
	| { ok: true; status: 'throttled' }
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

	if (isVerificationSmsThrottled(input.phoneNumber)) {
		return { ok: true, status: 'throttled' };
	}

	const code = createVerificationCode();
	const expiresAt = new Date(Date.now() + CODE_TTL_MS);

	await createPhoneVerificationToken({
		userId: input.userId,
		phoneNumber: input.phoneNumber,
		tokenHash: hashVerificationCode(code),
		expiresAt
	});

	if (!consumeVerificationSmsSend(input.phoneNumber)) {
		return { ok: true, status: 'throttled' };
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
	| { ok: false; reason: 'THROTTLED' }
> {
	const prepared = await preparePhoneVerificationSms(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'skipped') {
		return { ok: true };
	}

	if (prepared.status === 'throttled') {
		return { ok: false, reason: 'THROTTLED' };
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
