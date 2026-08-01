export type UserDisplay = {
	email: string;
	avatarUrl: string | null;
	initials: string;
};

export function buildUserDisplay(input: {
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	avatarUrl?: string | null;
}): UserDisplay {
	const firstName = input.firstName?.trim() ?? '';
	const lastName = input.lastName?.trim() ?? '';
	const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

	return {
		email: input.email,
		avatarUrl: input.avatarUrl?.trim() || null,
		initials
	};
}
