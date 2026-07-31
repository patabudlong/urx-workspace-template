import type { AuthUser } from '$lib/shared/schemas/auth';
import { signAccessToken } from '$lib/server/auth/jwt';
import { hashPassword } from '$lib/server/auth/password';
import { ACCESS_TOKEN_TTL_SECONDS } from '$lib/server/auth/session';
import {
	createUser,
	ensureUserIndexes,
	findUserByEmail
} from '$lib/server/repositories/users';

export type SignupResult =
	| {
			ok: true;
			accessToken: string;
			expiresIn: number;
			user: AuthUser;
	  }
	| {
			ok: false;
			reason: 'EMAIL_EXISTS' | 'AUTH_NOT_CONFIGURED';
	  };

export async function registerWithCredentials(input: {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}): Promise<SignupResult> {
	try {
		await ensureUserIndexes();

		const existing = await findUserByEmail(input.email);

		if (existing) {
			return { ok: false, reason: 'EMAIL_EXISTS' };
		}

		const passwordHash = await hashPassword(input.password);
		const user = await createUser({
			email: input.email,
			passwordHash,
			firstName: input.firstName,
			lastName: input.lastName
		});

		const authUser: AuthUser = {
			id: user._id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName
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
