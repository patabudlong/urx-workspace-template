import type { UserDocument } from '$lib/shared/models/user';
import type { AuthUser } from '$lib/shared/schemas/auth';
import { signAccessToken } from '$lib/server/auth/jwt';
import { ACCESS_TOKEN_TTL_SECONDS } from '$lib/server/auth/session';

export type AuthSession = {
	accessToken: string;
	expiresIn: number;
	user: AuthUser;
};

export function toAuthUser(user: UserDocument): AuthUser {
	return {
		id: user._id.toString(),
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName
	};
}

export async function createAuthSession(user: UserDocument): Promise<AuthSession> {
	const authUser = toAuthUser(user);
	const accessToken = await signAccessToken({
		sub: authUser.id,
		email: authUser.email
	});

	return {
		accessToken,
		expiresIn: ACCESS_TOKEN_TTL_SECONDS,
		user: authUser
	};
}
