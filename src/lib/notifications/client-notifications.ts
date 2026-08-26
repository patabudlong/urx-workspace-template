import type {
	ApiErrorResponse,
	ApiSuccessResponse,
	PaginatedResponse
} from '$lib/shared/api/types';
import type { NotificationSummary } from '$lib/shared/models/notification';

const POLL_INTERVAL_MS = 60_000;

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
	if (!response.ok) {
		return null;
	}

	return (await response.json()) as T;
}

export async function fetchUnreadNotificationCount(workspaceId?: string): Promise<number> {
	const params = new URLSearchParams();

	if (workspaceId) {
		params.set('workspaceId', workspaceId);
	}

	const query = params.toString();
	const response = await fetch(
		`/api/v1/notifications/unread-count${query ? `?${query}` : ''}`
	);

	const body = await parseJsonResponse<ApiSuccessResponse<{ count: number }>>(response);

	return body?.data.count ?? 0;
}

export async function fetchNotifications(input?: {
	page?: number;
	limit?: number;
	unreadOnly?: boolean;
	workspaceId?: string;
}): Promise<NotificationSummary[]> {
	const params = new URLSearchParams();

	if (input?.page) {
		params.set('page', String(input.page));
	}

	if (input?.limit) {
		params.set('limit', String(input.limit));
	}

	if (input?.unreadOnly) {
		params.set('unreadOnly', 'true');
	}

	if (input?.workspaceId) {
		params.set('workspaceId', input.workspaceId);
	}

	const response = await fetch(`/api/v1/notifications?${params.toString()}`);
	const body = await parseJsonResponse<PaginatedResponse<NotificationSummary[]>>(response);

	return body?.data ?? [];
}

export async function markNotificationReadClient(notificationId: string): Promise<boolean> {
	const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
		method: 'PATCH'
	});

	return response.ok;
}

export async function markAllNotificationsReadClient(workspaceId?: string): Promise<boolean> {
	const response = await fetch('/api/v1/notifications/read-all', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(workspaceId ? { workspaceId } : {})
	});

	return response.ok;
}

export function startNotificationPolling(
	onUnreadCount: (count: number) => void,
	workspaceId?: string
): () => void {
	let intervalId: ReturnType<typeof setInterval> | undefined;

	const poll = () => {
		if (document.visibilityState !== 'visible') {
			return;
		}

		void fetchUnreadNotificationCount(workspaceId).then(onUnreadCount);
	};

	const handleVisibilityChange = () => {
		if (document.visibilityState === 'visible') {
			poll();
		}
	};

	poll();
	intervalId = setInterval(poll, POLL_INTERVAL_MS);
	document.addEventListener('visibilitychange', handleVisibilityChange);

	return () => {
		if (intervalId) {
			clearInterval(intervalId);
		}

		document.removeEventListener('visibilitychange', handleVisibilityChange);
	};
}

export type { ApiErrorResponse };
