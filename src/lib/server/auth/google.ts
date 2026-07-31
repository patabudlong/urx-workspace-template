import { createAuthSession, type AuthSession } from '$lib/server/auth/session-user';
import type { GoogleProfile } from '$lib/server/auth/google-oauth';
import {
	createUser,
	ensureUserIndexes,
	findUserByEmail,
	findUserByGoogleId,
	linkGoogleAccount
} from '$lib/server/repositories/users';

export type GoogleAuthResult =
	| ({ ok: true; isNewUser: boolean } & AuthSession)
	| {
			ok: false;
			reason: 'AUTH_NOT_CONFIGURED' | 'ACCOUNT_EXISTS_WITH_DIFFERENT_PROVIDER';
	  };

export async function authenticateWithGoogle(profile: GoogleProfile): Promise<GoogleAuthResult> {
	try {
		await ensureUserIndexes();

		const existingByGoogleId = await findUserByGoogleId(profile.sub);

		if (existingByGoogleId) {
			const session = await createAuthSession(existingByGoogleId);

			return {
				ok: true,
				isNewUser: false,
				...session
			};
		}

		const existingByEmail = await findUserByEmail(profile.email);

		if (existingByEmail) {
			if (existingByEmail.googleId && existingByEmail.googleId !== profile.sub) {
				return { ok: false, reason: 'ACCOUNT_EXISTS_WITH_DIFFERENT_PROVIDER' };
			}

			const linkedUser =
				existingByEmail.googleId === profile.sub
					? existingByEmail
					: await linkGoogleAccount(existingByEmail._id.toString(), profile.sub);

			if (!linkedUser) {
				throw new Error('Failed to link Google account');
			}

			const session = await createAuthSession(linkedUser);

			return {
				ok: true,
				isNewUser: false,
				...session
			};
		}

		const user = await createUser({
			email: profile.email,
			googleId: profile.sub,
			firstName: profile.givenName,
			lastName: profile.familyName,
			emailVerifiedAt: new Date()
		});

		const session = await createAuthSession(user);

		return {
			ok: true,
			isNewUser: true,
			...session
		};
	} catch (error) {
		if (error instanceof Error && error.message.includes('JWT_SECRET')) {
			return { ok: false, reason: 'AUTH_NOT_CONFIGURED' };
		}

		throw error;
	}
}
