import { createHash, randomInt } from 'node:crypto';
import { isVerificationEmailThrottled } from '$lib/server/security/auth-rate-limit';
import { isMailConfigured } from '$lib/server/mail/index';
import { sendVerifyEmail } from '$lib/server/mail/verify-email';
import {
	createEmailVerificationToken,
	ensureEmailVerificationTokenIndexes,
	findValidEmailVerificationTokenForUser,
	markEmailVerificationTokenUsed
} from '$lib/server/repositories/email-verification-tokens';
import {
	ensureUserIndexes,
	findUserByEmail,
	isUserEmailVerified,
	markUserEmailVerified
} from '$lib/server/repositories/users';

const CODE_TTL_MS = 15 * 60 * 1000;

function hashVerificationCode(code: string): string {
	return createHash('sha256').update(code).digest('hex');
}

function createVerificationCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export async function requestVerificationEmail(input: {
	email: string;
	origin: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'SEND_FAILED' }
> {
	await Promise.all([ensureUserIndexes(), ensureEmailVerificationTokenIndexes()]);

	if (!(await isMailConfigured())) {
		return { ok: false, reason: 'MAIL_NOT_CONFIGURED' };
	}

	if (isVerificationEmailThrottled(input.email)) {
		return { ok: true };
	}

	const user = await findUserByEmail(input.email);

	if (!user || isUserEmailVerified(user)) {
		return { ok: true };
	}

	const code = createVerificationCode();
	const expiresAt = new Date(Date.now() + CODE_TTL_MS);

	await createEmailVerificationToken({
		userId: user._id.toString(),
		tokenHash: hashVerificationCode(code),
		expiresAt
	});

	try {
		await sendVerifyEmail({
			to: user.email,
			firstName: user.firstName,
			code,
			origin: input.origin
		});
	} catch (error) {
		console.error('Failed to send verification email', error);
		return { ok: false, reason: 'SEND_FAILED' };
	}

	return { ok: true };
}

export async function verifyEmailWithCode(input: {
	email: string;
	code: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'INVALID_CODE' }
	| { ok: false; reason: 'ALREADY_VERIFIED' }
	| { ok: false; reason: 'UPDATE_FAILED' }
> {
	const email = input.email.trim().toLowerCase();
	const code = input.code.trim();

	if (!email || !/^\d{6}$/.test(code)) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	await Promise.all([ensureUserIndexes(), ensureEmailVerificationTokenIndexes()]);

	const user = await findUserByEmail(email);

	if (!user) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	if (isUserEmailVerified(user)) {
		return { ok: false, reason: 'ALREADY_VERIFIED' };
	}

	const record = await findValidEmailVerificationTokenForUser(
		user._id.toString(),
		hashVerificationCode(code)
	);

	if (!record) {
		return { ok: false, reason: 'INVALID_CODE' };
	}

	const updated = await markUserEmailVerified(user._id.toString());

	if (!updated) {
		return { ok: false, reason: 'UPDATE_FAILED' };
	}

	await markEmailVerificationTokenUsed(record._id.toString());

	return { ok: true };
}
