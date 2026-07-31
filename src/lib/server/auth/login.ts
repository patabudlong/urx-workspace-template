import type { UserDocument } from '$lib/shared/models/user';
import type { AuthUser } from '$lib/shared/schemas/auth';
import { verifyPassword } from '$lib/server/auth/password';
import { createAuthSession, toAuthUser } from '$lib/server/auth/session-user';
import { findUserByEmail, isUserEmailVerified } from '$lib/server/repositories/users';

export type LoginResult =
	| {
			ok: true;
			accessToken: string;
			expiresIn: number;
			user: AuthUser;
	  }
	| {
			ok: false;
			reason: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'AUTH_NOT_CONFIGURED';
	  };

export async function authenticateWithCredentials(
	email: string,
	password: string
): Promise<LoginResult> {
	try {
		const user = await findUserByEmail(email);

		if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
			return { ok: false, reason: 'INVALID_CREDENTIALS' };
		}

		if (!isUserEmailVerified(user)) {
			return { ok: false, reason: 'EMAIL_NOT_VERIFIED' };
		}

		const session = await createAuthSession(user);

		return {
			ok: true,
			...session
		};
	} catch (error) {
		if (error instanceof Error && error.message.includes('JWT_SECRET')) {
			return { ok: false, reason: 'AUTH_NOT_CONFIGURED' };
		}

		throw error;
	}
}

export function toPublicUser(user: UserDocument): AuthUser {
	return toAuthUser(user);
}
