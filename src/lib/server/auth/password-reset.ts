import { createHash, randomBytes } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { hashPassword } from '$lib/server/auth/password';
import { matchesStoredPassword } from '$lib/server/auth/password-history';
import { isForgotPasswordEmailThrottled } from '$lib/server/security/auth-rate-limit';
import { isMailConfigured } from '$lib/server/mail/index';
import { sendPasswordResetEmail } from '$lib/server/mail/password-reset-email';
import { runInBackground } from '$lib/server/runtime/background-task';
import {
	createPasswordResetToken,
	ensurePasswordResetTokenIndexes,
	findValidPasswordResetToken,
	markPasswordResetTokenUsed
} from '$lib/server/repositories/password-reset-tokens';
import { ensureUserIndexes, findUserByEmail, findUserById, rotateUserPassword } from '$lib/server/repositories/users';
import { isPasswordStrong } from '$lib/shared/password-policy';

/** 16 bytes → base64url (~22 chars). Keeps email HTML href lines under 76 chars (7bit-safe). */
const TOKEN_BYTES = 16;
const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

function createRawResetToken(): string {
	return randomBytes(TOKEN_BYTES).toString('base64url');
}

export type PasswordResetEmailPayload = {
	to: string;
	firstName: string;
	resetUrl: string;
	origin: string;
};

export type PreparePasswordResetEmailResult =
	| { ok: true; status: 'send_pending'; payload: PasswordResetEmailPayload }
	| { ok: true; status: 'skipped' }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' };

export async function preparePasswordResetEmail(input: {
	email: string;
	origin: string;
}): Promise<PreparePasswordResetEmailResult> {
	await Promise.all([ensureUserIndexes(), ensurePasswordResetTokenIndexes()]);

	if (!(await isMailConfigured())) {
		return { ok: false, reason: 'MAIL_NOT_CONFIGURED' };
	}

	if (isForgotPasswordEmailThrottled(input.email)) {
		return { ok: true, status: 'skipped' };
	}

	const user = await findUserByEmail(input.email);

	if (!user?.passwordHash) {
		return { ok: true, status: 'skipped' };
	}

	const rawToken = createRawResetToken();
	const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

	await createPasswordResetToken({
		userId: user._id.toString(),
		tokenHash: hashResetToken(rawToken),
		expiresAt
	});

	const resetUrl = `${input.origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

	return {
		ok: true,
		status: 'send_pending',
		payload: {
			to: user.email,
			firstName: user.firstName,
			resetUrl,
			origin: input.origin
		}
	};
}

export async function sendPreparedPasswordResetEmail(
	payload: PasswordResetEmailPayload
): Promise<{ ok: true } | { ok: false; reason: 'SEND_FAILED' }> {
	try {
		await sendPasswordResetEmail(payload);
	} catch (error) {
		console.error('Failed to send password reset email', error);
		return { ok: false, reason: 'SEND_FAILED' };
	}

	return { ok: true };
}

/**
 * Web forms: create the token synchronously, then send mail in the background
 * so the response is not blocked on SMTP/Postmark.
 */
export async function queuePasswordResetEmailForWeb(
	event: Pick<RequestEvent, 'platform'>,
	input: {
		email: string;
		origin: string;
	}
): Promise<{ ok: true } | { ok: false; reason: 'MAIL_NOT_CONFIGURED' }> {
	const prepared = await preparePasswordResetEmail(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'send_pending') {
		const payload = prepared.payload;
		runInBackground(event, async () => {
			await sendPreparedPasswordResetEmail(payload);
		});
	}

	return { ok: true };
}

export async function requestPasswordReset(input: {
	email: string;
	origin: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'SEND_FAILED' }
> {
	const prepared = await preparePasswordResetEmail(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'skipped') {
		return { ok: true };
	}

	return sendPreparedPasswordResetEmail(prepared.payload);
}

export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
	if (!token.trim()) {
		return false;
	}

	await ensurePasswordResetTokenIndexes();

	const record = await findValidPasswordResetToken(hashResetToken(token));
	return record !== null;
}

export async function resetPasswordWithToken(input: {
	token: string;
	password: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'INVALID_TOKEN' }
	| { ok: false; reason: 'WEAK_PASSWORD' }
	| { ok: false; reason: 'PASSWORD_REUSED' }
	| { ok: false; reason: 'UPDATE_FAILED' }
> {
	await Promise.all([ensureUserIndexes(), ensurePasswordResetTokenIndexes()]);

	if (!isPasswordStrong(input.password)) {
		return { ok: false, reason: 'WEAK_PASSWORD' };
	}

	const record = await findValidPasswordResetToken(hashResetToken(input.token));

	if (!record) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	const user = await findUserById(record.userId.toString());

	if (!user) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	if (
		await matchesStoredPassword(
			input.password,
			user.passwordHash,
			user.passwordHistory ?? []
		)
	) {
		return { ok: false, reason: 'PASSWORD_REUSED' };
	}

	const passwordHash = await hashPassword(input.password);
	const updated = await rotateUserPassword(record.userId.toString(), {
		newPasswordHash: passwordHash,
		currentPasswordHash: user.passwordHash,
		passwordHistory: user.passwordHistory
	});

	if (!updated) {
		return { ok: false, reason: 'UPDATE_FAILED' };
	}

	await markPasswordResetTokenUsed(record._id.toString());

	return { ok: true };
}
