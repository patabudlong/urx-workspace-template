import type { MailboxMessageDetail } from '$lib/shared/mailbox/schemas';
import type { ApiSuccessResponse } from '$lib/shared/api/types';

const messageCache = new Map<string, MailboxMessageDetail>();
const inflightRequests = new Map<string, Promise<MailboxMessageDetail>>();

function cacheKey(folder: string, uid: number): string {
	return `${folder}:${uid}`;
}

export function getCachedMailboxMessage(
	folder: string,
	uid: number
): MailboxMessageDetail | null {
	return messageCache.get(cacheKey(folder, uid)) ?? null;
}

export function prefetchMailboxMessage(folder: string, uid: number): void {
	void fetchMailboxMessage(folder, uid).catch(() => undefined);
}

export async function fetchMailboxMessage(
	folder: string,
	uid: number,
	signal?: AbortSignal
): Promise<MailboxMessageDetail> {
	const key = cacheKey(folder, uid);
	const cached = messageCache.get(key);
	if (cached) {
		return cached;
	}

	const inflight = inflightRequests.get(key);
	if (inflight) {
		return inflight;
	}

	const request = (async () => {
		const response = await fetch(
			`/api/v1/mailbox/messages/${uid}?folder=${encodeURIComponent(folder)}`,
			{ signal }
		);
		const body = (await response.json()) as ApiSuccessResponse<MailboxMessageDetail> & {
			error?: { message?: string };
		};

		if (!response.ok) {
			throw new Error(body.error?.message ?? 'Failed to load mailbox message');
		}

		messageCache.set(key, body.data);
		return body.data;
	})();

	inflightRequests.set(key, request);

	try {
		return await request;
	} finally {
		inflightRequests.delete(key);
	}
}
