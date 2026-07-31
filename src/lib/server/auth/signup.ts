import type { AuthUser } from '$lib/shared/schemas/auth';
import { hashPassword } from '$lib/server/auth/password';
import { toAuthUser } from '$lib/server/auth/session-user';
import {
	createUser,
	ensureUserIndexes,
	findUserByEmail
} from '$lib/server/repositories/users';
import type { TermsConsent } from '$lib/shared/models/user';

export type SignupResult =
	| {
			ok: true;
			user: AuthUser;
	  }
	| {
			ok: false;
			reason: 'EMAIL_EXISTS';
	  };

export async function registerWithCredentials(input: {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	termsConsent: TermsConsent;
}): Promise<SignupResult> {
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
		lastName: input.lastName,
		termsConsent: input.termsConsent
	});

	return {
		ok: true,
		user: toAuthUser(user)
	};
}
