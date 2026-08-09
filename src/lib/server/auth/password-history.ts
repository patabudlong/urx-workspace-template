import { verifyPassword } from '$lib/server/auth/password';
import { PASSWORD_HISTORY_LIMIT } from '$lib/shared/password-policy';

export async function matchesStoredPassword(
	password: string,
	passwordHash?: string,
	passwordHistory: string[] = []
): Promise<boolean> {
	const hashes = [passwordHash, ...passwordHistory].filter((hash): hash is string => Boolean(hash));

	for (const hash of hashes) {
		if (await verifyPassword(password, hash)) {
			return true;
		}
	}

	return false;
}
