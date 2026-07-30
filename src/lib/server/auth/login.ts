import type { UserDocument } from '$lib/shared/models/user';
import type { AuthUser } from '$lib/shared/schemas/auth';
import { signAccessToken } from '$lib/server/auth/jwt';
import { verifyPassword } from '$lib/server/auth/password';
import { ACCESS_TOKEN_TTL_SECONDS } from '$lib/server/auth/session';
import { findUserByEmail } from '$lib/server/repositories/users';

export type LoginResult =
	| {
			ok: true;
			accessToken: string;
			expiresIn: number;
			user: AuthUser;
	  }
	| {
			ok: false;
			reason: 'INVALID_CREDENTIALS' | 'AUTH_NOT_CONFIGURED';
	  };

export async function authenticateWithCredentials(
	email: string,
	password: string
): Promise<LoginResult> {
	try {
		const user = await findUserByEmail(email);

		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return { ok: false, reason: 'INVALID_CREDENTIALS' };
		}

		const authUser: AuthUser = {
			id: user._id.toString(),
			email: user.email,
			name: user.name
		};

		const accessToken = await signAccessToken({
			sub: authUser.id,
			email: authUser.email
		});

		return {
			ok: true,
			accessToken,
			expiresIn: ACCESS_TOKEN_TTL_SECONDS,
			user: authUser
		};
	} catch (error) {
		if (error instanceof Error && error.message.includes('JWT_SECRET')) {
			return { ok: false, reason: 'AUTH_NOT_CONFIGURED' };
		}

		throw error;
	}
}

export function toPublicUser(user: UserDocument): AuthUser {
	return {
		id: user._id.toString(),
		email: user.email,
		name: user.name
	};
}
