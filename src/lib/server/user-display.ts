import { findUserById } from '$lib/server/repositories/users';
import { buildUserDisplay, type UserDisplay } from '$lib/shared/user-display';

export async function loadUserDisplay(
	userId: string,
	fallbackEmail: string
): Promise<UserDisplay> {
	const user = await findUserById(userId);

	return buildUserDisplay({
		email: user?.email ?? fallbackEmail,
		firstName: user?.firstName,
		lastName: user?.lastName,
		avatarUrl: user?.avatarUrl
	});
}
