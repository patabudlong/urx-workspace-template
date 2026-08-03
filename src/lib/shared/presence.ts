export const PRESENCE_STATUSES = {
	ONLINE: 'online',
	AWAY: 'away',
	BUSY: 'busy',
	OFFLINE: 'offline'
} as const;

export type PresenceStatus = (typeof PRESENCE_STATUSES)[keyof typeof PRESENCE_STATUSES];

export const PRESENCE_STATUS_OPTIONS: PresenceStatus[] = [
	PRESENCE_STATUSES.ONLINE,
	PRESENCE_STATUSES.AWAY,
	PRESENCE_STATUSES.BUSY,
	PRESENCE_STATUSES.OFFLINE
];

export const PRESENCE_STATUS_LABELS: Record<PresenceStatus, string> = {
	online: 'Online',
	away: 'Away',
	busy: 'Busy',
	offline: 'Offline'
};

/** Without a heartbeat within this window, a user is shown as offline. */
export const PRESENCE_STALE_MS = 5 * 60 * 1000;

export function resolveEffectivePresenceStatus(
	status: PresenceStatus | null | undefined,
	lastSeenAt: Date | string | null | undefined,
	now = new Date()
): PresenceStatus {
	const rawStatus = status ?? PRESENCE_STATUSES.ONLINE;

	if (rawStatus === PRESENCE_STATUSES.OFFLINE) {
		return PRESENCE_STATUSES.OFFLINE;
	}

	if (!lastSeenAt) {
		return PRESENCE_STATUSES.OFFLINE;
	}

	const lastSeen = lastSeenAt instanceof Date ? lastSeenAt : new Date(lastSeenAt);
	const elapsed = now.getTime() - lastSeen.getTime();

	if (elapsed > PRESENCE_STALE_MS) {
		return PRESENCE_STATUSES.OFFLINE;
	}

	return rawStatus;
}
