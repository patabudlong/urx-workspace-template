import type { PresenceStatus } from '$lib/shared/presence';
import type { UserProfile } from '$lib/shared/schemas/account';

type ApiSuccessResponse<T> = {
	data: T;
};

type ApiErrorResponse = {
	error: {
		code: string;
		message: string;
	};
};

const HEARTBEAT_INTERVAL_MS = 60_000;

async function parseProfileResponse(
	response: Response
): Promise<UserProfile | null> {
	const body = (await response.json()) as
		| ApiSuccessResponse<{ profile: UserProfile }>
		| ApiErrorResponse;

	if (!response.ok) {
		return null;
	}

	return (body as ApiSuccessResponse<{ profile: UserProfile }>).data.profile;
}

export async function sendPresenceHeartbeat(): Promise<UserProfile | null> {
	const response = await fetch('/api/v1/users/me/presence/heartbeat', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		}
	});

	return parseProfileResponse(response);
}

export async function updatePresenceStatus(status: PresenceStatus): Promise<UserProfile | null> {
	const response = await fetch('/api/v1/users/me/presence', {
		method: 'PATCH',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({ status })
	});

	return parseProfileResponse(response);
}

export function startPresenceHeartbeat(
	onProfile?: (profile: UserProfile) => void
): () => void {
	let intervalId: ReturnType<typeof setInterval> | undefined;

	const beat = () => {
		if (document.visibilityState !== 'visible') {
			return;
		}

		void sendPresenceHeartbeat().then((profile) => {
			if (profile) {
				onProfile?.(profile);
			}
		});
	};

	const handleVisibilityChange = () => {
		if (document.visibilityState === 'visible') {
			beat();
		}
	};

	beat();
	intervalId = setInterval(beat, HEARTBEAT_INTERVAL_MS);
	document.addEventListener('visibilitychange', handleVisibilityChange);

	return () => {
		if (intervalId) {
			clearInterval(intervalId);
		}

		document.removeEventListener('visibilitychange', handleVisibilityChange);
	};
}
