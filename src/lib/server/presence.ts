import type { UserDocument } from '$lib/shared/models/user';
import { resolveEffectivePresenceStatus } from '$lib/shared/presence';

export function resolveUserPresenceStatus(user: UserDocument) {
	return resolveEffectivePresenceStatus(user.presenceStatus, user.lastSeenAt);
}
