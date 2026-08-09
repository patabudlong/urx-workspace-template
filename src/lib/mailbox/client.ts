import type {
	MailboxFolder,
	MailboxMessageAction,
	MailboxMessageDetail,
	MailboxMessageSummary
} from '$lib/shared/mailbox/schemas';
import type { ApiSuccessResponse, PaginationMeta } from '$lib/shared/api/types';

const messageCache = new Map<string, MailboxMessageDetail>();
const inflightRequests = new Map<string, Promise<MailboxMessageDetail>>();

type FetchMailboxMessageOptions = {
	signal?: AbortSignal;
};

function cacheKey(folder: string, uid: number): string {
	return `${folder}:${uid}`;
}

export function invalidateMailboxMessageCache(folder: string, uid: number): void {
	messageCache.delete(cacheKey(folder, uid));
}

export function updateCachedMailboxMessage(
	folder: string,
	uid: number,
	patch: Partial<Pick<MailboxMessageDetail, 'seen' | 'flagged'>>
): MailboxMessageDetail | null {
	const key = cacheKey(folder, uid);
	const cached = messageCache.get(key);
	if (!cached) {
		return null;
	}

	const updated = { ...cached, ...patch };
	messageCache.set(key, updated);
	return updated;
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

type MailboxFetchInit = {
	fetch?: typeof globalThis.fetch;
	signal?: AbortSignal;
};

export async function fetchMailboxFolders(init: MailboxFetchInit = {}): Promise<MailboxFolder[]> {
	const fetchFn = init.fetch ?? globalThis.fetch;
	const response = await fetchFn('/api/v1/mailbox/folders', { signal: init.signal });
	const body = (await response.json()) as ApiSuccessResponse<{ folders: MailboxFolder[] }> & {
		error?: { message?: string };
	};

	if (!response.ok) {
		throw new Error(body.error?.message ?? 'Failed to load mailbox folders');
	}

	return body.data.folders;
}

export type MailboxFolderPage = {
	folders: MailboxFolder[];
	messages: MailboxMessageSummary[];
	pagination: PaginationMeta;
};

export async function fetchMailboxFolderPage(
	folder: string,
	page: number,
	limit: number,
	init: MailboxFetchInit = {}
): Promise<MailboxFolderPage> {
	const fetchFn = init.fetch ?? globalThis.fetch;
	const params = new URLSearchParams({
		folder,
		page: String(page),
		limit: String(limit)
	});
	const response = await fetchFn(`/api/v1/mailbox/folder-page?${params}`, { signal: init.signal });
	const body = (await response.json()) as ApiSuccessResponse<{
		folders: MailboxFolder[];
		messages: MailboxMessageSummary[];
		pagination: PaginationMeta;
	}> & {
		error?: { message?: string };
	};

	if (!response.ok) {
		throw new Error(body.error?.message ?? 'Failed to load mailbox');
	}

	return {
		folders: body.data.folders,
		messages: body.data.messages,
		pagination: body.data.pagination
	};
}

export async function fetchMailboxMessage(
	folder: string,
	uid: number,
	options: FetchMailboxMessageOptions = {}
): Promise<MailboxMessageDetail> {
	const { signal } = options;
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

export type MailboxMessageActionResult =
	| { type: 'updated'; seen: boolean; flagged: boolean }
	| { type: 'moved' };

export async function patchMailboxMessage(
	folder: string,
	uid: number,
	action: MailboxMessageAction
): Promise<MailboxMessageActionResult> {
	const response = await fetch(`/api/v1/mailbox/messages/${uid}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ folder, action })
	});

	const body = (await response.json()) as ApiSuccessResponse<MailboxMessageActionResult> & {
		error?: { message?: string };
	};

	if (!response.ok) {
		throw new Error(body.error?.message ?? 'Failed to update mailbox message');
	}

	if (body.data.type === 'updated') {
		updateCachedMailboxMessage(folder, uid, {
			seen: body.data.seen,
			flagged: body.data.flagged
		});
	} else {
		invalidateMailboxMessageCache(folder, uid);
	}

	return body.data;
}
