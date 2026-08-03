import type { UserDocument } from '$lib/shared/models/user';
import type { UserProfile } from '$lib/shared/schemas/account';
import {
	isUserEmailVerified,
	isUserPhoneVerified
} from '$lib/server/repositories/users';
import { resolveUserPresenceStatus } from '$lib/server/presence';

export function toUserProfile(user: UserDocument): UserProfile {
	return {
		id: user._id.toString(),
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		avatarUrl: user.avatarUrl?.trim() || null,
		phoneNumber: user.phoneNumber?.trim() || null,
		phoneVerified: isUserPhoneVerified(user),
		emailVerified: isUserEmailVerified(user),
		hasGoogleAccount: Boolean(user.googleId),
		presenceStatus: resolveUserPresenceStatus(user),
		lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
		createdAt: user.createdAt.toISOString()
	};
}
