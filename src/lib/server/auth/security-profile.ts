import type { UserDocument } from '$lib/shared/models/user';
import type { SecurityProfile } from '$lib/shared/schemas/security';

function toIsoDateString(value: Date | undefined): string | null {
	if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
		return null;
	}

	return value.toISOString();
}

export function toSecurityProfile(user: UserDocument): SecurityProfile {
	const hasAppPassword = Boolean(user.passwordHash);

	return {
		hasAppPassword,
		hasGoogleAccount: Boolean(user.googleId),
		passwordChangedAt: hasAppPassword
			? toIsoDateString(user.passwordChangedAt) ?? toIsoDateString(user.createdAt)
			: null
	};
}
