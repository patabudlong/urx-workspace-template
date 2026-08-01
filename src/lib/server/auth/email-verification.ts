import { createHash, randomInt } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { isVerificationEmailThrottled } from '$lib/server/security/auth-rate-limit';
import { isMailConfigured } from '$lib/server/mail/index';
import { sendVerifyEmail } from '$lib/server/mail/verify-email';
import { runInBackground } from '$lib/server/runtime/background-task';
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

	if (isVerificationEmailThrottled(input.email)) {
		return { ok: true, status: 'skipped' };
	}

	const user = await findUserByEmail(input.email);

	if (!user || isUserEmailVerified(user)) {
		return { ok: true, status: 'skipped' };
	}

	const code = createVerificationCode();
	const expiresAt = new Date(Date.now() + CODE_TTL_MS);

	await createEmailVerificationToken({
		userId: user._id.toString(),
		tokenHash: hashVerificationCode(code),
		expiresAt
	});

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

/**
 * Web forms: create the token synchronously, then send mail in the background
 * so redirects are not blocked on SMTP.
 */
export async function queueVerificationEmailForWeb(
	event: Pick<RequestEvent, 'platform'>,
	input: {
		email: string;
		origin: string;
	}
): Promise<{ ok: true } | { ok: false; reason: 'MAIL_NOT_CONFIGURED' }> {
	const prepared = await prepareVerificationEmail(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'send_pending') {
		const payload = prepared.payload;
		runInBackground(event, async () => {
			await sendPreparedVerificationEmail(payload);
		});
	}

	return { ok: true };
}

/** API and other callers that need a definitive send result. */
export async function requestVerificationEmail(input: {
	email: string;
	origin: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'SEND_FAILED' }
> {
	const prepared = await prepareVerificationEmail(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'skipped') {
		return { ok: true };
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
