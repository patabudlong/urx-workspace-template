import type { UserDocument } from '$lib/shared/models/user';
import type { AuthUser } from '$lib/shared/schemas/auth';
import type { Cookies } from '@sveltejs/kit';
import { verifyPassword } from '$lib/server/auth/password';
import { resolveAuthSessionOrChallenge } from '$lib/server/auth/two-factor/challenge';
import { toAuthUser } from '$lib/server/auth/session-user';
import { ACCESS_TOKEN_TTL_SECONDS } from '$lib/server/auth/session';
import { findUserByEmail, isUserEmailVerified } from '$lib/server/repositories/users';
import type { TwoFactorMethod } from '$lib/shared/models/two-factor';

export type LoginResult =
	| {
			ok: true;
			accessToken: string;
			expiresIn: number;
			user: AuthUser;
	  }
	| {
			ok: true;
			twoFactorRequired: true;
			pendingToken: string;
			methods: TwoFactorMethod[];
			expiresIn: number;
	  }
	| {
			ok: false;
			reason: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'AUTH_NOT_CONFIGURED';
	  };

export async function authenticateWithCredentials(
	email: string,
	password: string,
	cookies?: Cookies
): Promise<LoginResult> {
	try {
		const user = await findUserByEmail(email);

		if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
			return { ok: false, reason: 'INVALID_CREDENTIALS' };
		}

		if (!isUserEmailVerified(user)) {
			return { ok: false, reason: 'EMAIL_NOT_VERIFIED' };
		}

		const authResult = await resolveAuthSessionOrChallenge(user, cookies);

		if (authResult.status === 'two_factor_required') {
			return {
				ok: true,
				twoFactorRequired: true,
				pendingToken: authResult.pendingToken,
				methods: authResult.methods,
				expiresIn: ACCESS_TOKEN_TTL_SECONDS
			};
		}

		return {
			ok: true,
			...authResult.session
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
