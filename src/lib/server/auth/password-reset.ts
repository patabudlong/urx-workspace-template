import { createHash, randomBytes } from 'node:crypto';
import { hashPassword } from '$lib/server/auth/password';
import { isMailConfigured } from '$lib/server/mail/index';
import { sendPasswordResetEmail } from '$lib/server/mail/password-reset-email';
import {
	createPasswordResetToken,
	ensurePasswordResetTokenIndexes,
	findValidPasswordResetToken,
	markPasswordResetTokenUsed
} from '$lib/server/repositories/password-reset-tokens';
import { ensureUserIndexes, findUserByEmail, updateUserPassword } from '$lib/server/repositories/users';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(input: {
	email: string;
	origin: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'SEND_FAILED' }
> {
	await Promise.all([ensureUserIndexes(), ensurePasswordResetTokenIndexes()]);

	if (!(await isMailConfigured())) {
		return { ok: false, reason: 'MAIL_NOT_CONFIGURED' };
	}

	const user = await findUserByEmail(input.email);

	if (!user?.passwordHash) {
		return { ok: true };
	}

	const rawToken = randomBytes(TOKEN_BYTES).toString('hex');
	const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

	await createPasswordResetToken({
		userId: user._id.toString(),
		tokenHash: hashResetToken(rawToken),
		expiresAt
	});

	const resetUrl = `${input.origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

	try {
		await sendPasswordResetEmail({
			to: user.email,
			firstName: user.firstName,
			resetUrl
		});
	} catch (error) {
		console.error('Failed to send password reset email', error);
		return { ok: false, reason: 'SEND_FAILED' };
	}

	return { ok: true };
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
	| { ok: false; reason: 'UPDATE_FAILED' }
> {
	await Promise.all([ensureUserIndexes(), ensurePasswordResetTokenIndexes()]);

	const record = await findValidPasswordResetToken(hashResetToken(input.token));

	if (!record) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	const passwordHash = await hashPassword(input.password);
	const updated = await updateUserPassword(record.userId.toString(), passwordHash);

	if (!updated) {
		return { ok: false, reason: 'UPDATE_FAILED' };
	}

	await markPasswordResetTokenUsed(record._id.toString());

	return { ok: true };
}
