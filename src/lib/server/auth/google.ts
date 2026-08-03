import type { Cookies } from '@sveltejs/kit';
import { resolveAuthSessionOrChallenge } from '$lib/server/auth/two-factor/challenge';
import type { GoogleProfile } from '$lib/server/auth/google-oauth';
import type { AuthSession } from '$lib/server/auth/session-user';
import { ACCESS_TOKEN_TTL_SECONDS } from '$lib/server/auth/session';
import type { TwoFactorMethod } from '$lib/shared/models/two-factor';
import {
	createUser,
	ensureUserIndexes,
	findUserByEmail,
	findUserByGoogleId,
	linkGoogleAccount,
	updateUserGoogleAvatar
} from '$lib/server/repositories/users';

export type GoogleAuthResult =
	| ({ ok: true; isNewUser: boolean } & AuthSession)
	| {
			ok: true;
			isNewUser: boolean;
			twoFactorRequired: true;
			pendingToken: string;
			methods: TwoFactorMethod[];
			expiresIn: number;
	  }
	| {
			ok: false;
			reason: 'AUTH_NOT_CONFIGURED' | 'ACCOUNT_EXISTS_WITH_DIFFERENT_PROVIDER';
	  };

async function resolveGoogleUserSession(
	user: Awaited<ReturnType<typeof findUserByGoogleId>>,
	isNewUser: boolean,
	cookies?: Cookies
): Promise<GoogleAuthResult> {
	const authResult = await resolveAuthSessionOrChallenge(user!, cookies);

	if (authResult.status === 'two_factor_required') {
		return {
			ok: true,
			isNewUser,
			twoFactorRequired: true,
			pendingToken: authResult.pendingToken,
			methods: authResult.methods,
			expiresIn: ACCESS_TOKEN_TTL_SECONDS
		};
	}

	return {
		ok: true,
		isNewUser,
		...authResult.session
	};
}

export async function authenticateWithGoogle(
	profile: GoogleProfile,
	cookies?: Cookies
): Promise<GoogleAuthResult> {
	try {
		await ensureUserIndexes();

		const existingByGoogleId = await findUserByGoogleId(profile.sub);

		if (existingByGoogleId) {
			await updateUserGoogleAvatar(existingByGoogleId._id.toString(), profile.pictureUrl);
			return resolveGoogleUserSession(existingByGoogleId, false, cookies);
		}

		const existingByEmail = await findUserByEmail(profile.email);

		if (existingByEmail) {
			if (existingByEmail.googleId && existingByEmail.googleId !== profile.sub) {
				return { ok: false, reason: 'ACCOUNT_EXISTS_WITH_DIFFERENT_PROVIDER' };
			}

			const linkedUser =
				existingByEmail.googleId === profile.sub
					? existingByEmail
					: await linkGoogleAccount(
							existingByEmail._id.toString(),
							profile.sub,
							profile.pictureUrl
						);

			if (!linkedUser) {
				throw new Error('Failed to link Google account');
			}

			await updateUserGoogleAvatar(linkedUser._id.toString(), profile.pictureUrl);
			return resolveGoogleUserSession(linkedUser, false, cookies);
		}

		const user = await createUser({
			email: profile.email,
			googleId: profile.sub,
			firstName: profile.givenName,
			lastName: profile.familyName,
			avatarUrl: profile.pictureUrl,
			emailVerifiedAt: new Date()
		});

		return resolveGoogleUserSession(user, true, cookies);
	} catch (error) {
		if (error instanceof Error && error.message.includes('JWT_SECRET')) {
			return { ok: false, reason: 'AUTH_NOT_CONFIGURED' };
		}

		throw error;
	}
}
