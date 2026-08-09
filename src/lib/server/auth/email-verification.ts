import { createHash, randomInt } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import {
	consumeVerificationEmailSend,
	isVerificationEmailThrottled
} from '$lib/server/security/auth-rate-limit';
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

export type VerificationEmailPayload = {
	to: string;
	firstName: string;
	code: string;
	origin: string;
};

export type PrepareVerificationEmailResult =
	| { ok: true; status: 'send_pending'; payload: VerificationEmailPayload }
	| { ok: true; status: 'skipped' }
	| { ok: true; status: 'throttled' }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' };

function hashVerificationCode(code: string): string {
	return createHash('sha256').update(code).digest('hex');
}

function createVerificationCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export async function prepareVerificationEmail(input: {
	email: string;
	origin: string;
}): Promise<PrepareVerificationEmailResult> {
	await Promise.all([ensureUserIndexes(), ensureEmailVerificationTokenIndexes()]);

	if (!(await isMailConfigured())) {
		return { ok: false, reason: 'MAIL_NOT_CONFIGURED' };
	}

	const email = input.email.trim().toLowerCase();
	const user = await findUserByEmail(email);

	if (!user || isUserEmailVerified(user)) {
		return { ok: true, status: 'skipped' };
	}

	if (isVerificationEmailThrottled(email)) {
		return { ok: true, status: 'throttled' };
	}

	const code = createVerificationCode();
	const expiresAt = new Date(Date.now() + CODE_TTL_MS);

	await createEmailVerificationToken({
		userId: user._id.toString(),
		tokenHash: hashVerificationCode(code),
		expiresAt
	});

	if (!consumeVerificationEmailSend(email)) {
		return { ok: true, status: 'throttled' };
	}

	return {
		ok: true,
		status: 'send_pending',
		payload: {
			to: user.email,
			firstName: user.firstName,
			code,
			origin: input.origin
		}
	};
}

export async function sendPreparedVerificationEmail(
	payload: VerificationEmailPayload
): Promise<{ ok: true } | { ok: false; reason: 'SEND_FAILED' }> {
	try {
		await sendVerifyEmail(payload);
	} catch (error) {
		console.error('Failed to send verification email', error);
		return { ok: false, reason: 'SEND_FAILED' };
	}

	return { ok: true };
}

/** Web forms: create the token, then send mail before redirecting. */
export async function queueVerificationEmailForWeb(
	_event: Pick<RequestEvent, 'platform'>,
	input: {
		email: string;
		origin: string;
	}
): Promise<
	| { ok: true }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'SEND_FAILED' }
	| { ok: false; reason: 'THROTTLED' }
> {
	const prepared = await prepareVerificationEmail(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'skipped') {
		return { ok: true };
	}

	if (prepared.status === 'throttled') {
		return { ok: false, reason: 'THROTTLED' };
	}

	return sendPreparedVerificationEmail(prepared.payload);
}

/** API and other callers that need a definitive send result. */
export async function requestVerificationEmail(input: {
	email: string;
	origin: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'SEND_FAILED' }
	| { ok: false; reason: 'THROTTLED' }
> {
	const prepared = await prepareVerificationEmail(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'skipped') {
		return { ok: true };
	}

	if (prepared.status === 'throttled') {
		return { ok: false, reason: 'THROTTLED' };
	}

	return sendPreparedVerificationEmail(prepared.payload);
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
