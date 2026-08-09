import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createImapClient } from './verify';
import { sortMailboxFolders } from '$lib/mailbox/utils';
import type { MailboxFolder, MailboxMessageDetail, MailboxMessageSummary } from '$lib/shared/mailbox/schemas';
import { getMailboxConfig } from './config';
import { inlineCidImagesInHtml } from './html';
import { verifyMailboxCredentials } from './verify';

type AddressLike = {
	name?: string;
	address?: string;
};

function formatAddress(address: AddressLike | undefined): string {
	if (!address?.address) {
		return '';
	}

	if (address.name) {
		return `${address.name} <${address.address}>`;
	}

	return address.address;
}

function formatAddressList(addresses: AddressLike[] | undefined): string[] {
	if (!addresses?.length) {
		return [];
	}

	return addresses.map((entry) => formatAddress(entry)).filter(Boolean);
}

function hasAttachments(bodyStructure: unknown): boolean {
	if (!bodyStructure || typeof bodyStructure !== 'object') {
		return false;
	}

	const node = bodyStructure as {
		type?: string;
		childNodes?: unknown[];
	};

	if (node.type?.toLowerCase() === 'multipart/mixed') {
		return true;
	}

	return node.childNodes?.some((child) => hasAttachments(child)) ?? false;
}

/** PrivateEmail (and similar) often choke on concurrent IMAP logins — serialize per user. */
const imapQueues = new Map<string, Promise<unknown>>();

/** Keep the TLS session warm briefly so list → open / folders → messages skip reconnect. */
const IMAP_SESSION_IDLE_MS = 60_000;

type ImapSession = {
	client: ImapFlow;
	idleTimer: ReturnType<typeof setTimeout> | null;
};

const imapSessions = new Map<string, ImapSession>();

async function destroyImapSession(userId: string): Promise<void> {
	const session = imapSessions.get(userId);
	if (!session) {
		return;
	}

	imapSessions.delete(userId);
	if (session.idleTimer) {
		clearTimeout(session.idleTimer);
		session.idleTimer = null;
	}

	await session.client.logout().catch(() => undefined);
}

function scheduleImapIdleLogout(userId: string): void {
	const session = imapSessions.get(userId);
	if (!session) {
		return;
	}

	if (session.idleTimer) {
		clearTimeout(session.idleTimer);
	}

	session.idleTimer = setTimeout(() => {
		void destroyImapSession(userId);
	}, IMAP_SESSION_IDLE_MS);
}

async function acquireImapClient(userId: string): Promise<ImapFlow> {
	const existing = imapSessions.get(userId);
	if (existing) {
		if (existing.idleTimer) {
			clearTimeout(existing.idleTimer);
			existing.idleTimer = null;
		}

		if (existing.client.usable) {
			return existing.client;
		}

		await destroyImapSession(userId);
	}

	const config = await getMailboxConfig(userId);
	if (!config) {
		throw new Error('Mailbox is not configured');
	}

	const client = createImapClient(config);
	await client.connect();
	imapSessions.set(userId, { client, idleTimer: null });
	return client;
}

/** Drop a pooled IMAP session (e.g. after reconnect / disconnect). */
export async function invalidateMailboxImapSession(userId: string): Promise<void> {
	await destroyImapSession(userId);
}

async function withImapClient<T>(userId: string, fn: (client: ImapFlow) => Promise<T>): Promise<T> {
	const previous = imapQueues.get(userId) ?? Promise.resolve();

	const run = previous.catch(() => undefined).then(async () => {
		const client = await acquireImapClient(userId);

		try {
			return await fn(client);
		} catch (error) {
			if (!client.usable) {
				await destroyImapSession(userId);
			}
			throw error;
		} finally {
			scheduleImapIdleLogout(userId);
		}
	});

	imapQueues.set(userId, run);

	try {
		return await run;
	} finally {
		if (imapQueues.get(userId) === run) {
			imapQueues.delete(userId);
		}
	}
}

function isFolderStatusPriority(mailbox: {
	path?: string;
	specialUse?: string | null;
	flags?: Set<string>;
}): boolean {
	if (!mailbox.path) {
		return false;
	}

	if (mailbox.flags?.has('\\Noselect') || mailbox.flags?.has('\\NonExistent')) {
		return false;
	}

	if (mailbox.specialUse) {
		return true;
	}

	return mailbox.path.toUpperCase() === 'INBOX';
}

async function fetchMailboxFolders(client: ImapFlow): Promise<MailboxFolder[]> {
	// Avoid list({ statusQuery }) — without LIST-STATUS, ImapFlow falls back to N sequential
	// STATUS calls (very slow). LIST first, then STATUS only the primary folders.
	const mailboxes = await client.list();
	const folders: MailboxFolder[] = [];

	for (const mailbox of mailboxes) {
		if (!mailbox.path) {
			continue;
		}

		folders.push({
			path: mailbox.path,
			name: mailbox.name || mailbox.path,
			specialUse: mailbox.specialUse ?? null,
			unseen: 0,
			total: 0
		});
	}

	for (const mailbox of mailboxes.filter(isFolderStatusPriority)) {
		if (!mailbox.path) {
			continue;
		}

		try {
			const status = await client.status(mailbox.path, { unseen: true, messages: true });
			const folder = folders.find((entry) => entry.path === mailbox.path);
			if (folder) {
				folder.unseen = status.unseen ?? 0;
				folder.total = status.messages ?? 0;
			}
		} catch {
			// Some folders may not be selectable.
		}
	}

	return sortMailboxFolders(folders);
}

export async function listMailboxFolders(userId: string): Promise<MailboxFolder[]> {
	return withImapClient(userId, (client) => fetchMailboxFolders(client));
}

function mapSummary(message: {
	uid: number;
	envelope?: {
		subject?: string;
		from?: AddressLike[];
		to?: AddressLike[];
		date?: Date | string;
	};
	flags?: Set<string>;
	source?: Buffer;
	bodyStructure?: unknown;
}): MailboxMessageSummary {
	const dateValue = message.envelope?.date;
	const date =
		dateValue instanceof Date
			? dateValue.toISOString()
			: typeof dateValue === 'string'
				? new Date(dateValue).toISOString()
				: new Date(0).toISOString();

	return {
		uid: message.uid,
		subject: message.envelope?.subject?.trim() || '(No subject)',
		from: formatAddress(message.envelope?.from?.[0]),
		to: formatAddressList(message.envelope?.to),
		date,
		seen: message.flags?.has('\\Seen') ?? false,
		answered: message.flags?.has('\\Answered') ?? false,
		flagged: message.flags?.has('\\Flagged') ?? false,
		hasAttachments: hasAttachments(message.bodyStructure),
		preview: ''
	};
}

async function fetchMailboxMessageSummariesByUids(
	client: ImapFlow,
	uids: number[]
): Promise<MailboxMessageSummary[]> {
	if (uids.length === 0) {
		return [];
	}

	const items: MailboxMessageSummary[] = [];
	for await (const message of client.fetch(
		uids,
		{
			uid: true,
			envelope: true,
			flags: true,
			bodyStructure: true
		},
		{ uid: true }
	)) {
		items.push(mapSummary(message));
	}

	items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	return items;
}

async function fetchMailboxMessages(
	client: ImapFlow,
	folder: string,
	page: number,
	limit: number,
	query?: string
): Promise<{ items: MailboxMessageSummary[]; total: number }> {
	const lock = await client.getMailboxLock(folder);

	try {
		if (query) {
			// RFC 3501 TEXT — headers + body. Supported by PrivateEmail IMAP.
			const searchResult = await client.search({ text: query }, { uid: true });
			const matchedUids = Array.isArray(searchResult) ? searchResult : [];
			const total = matchedUids.length;
			if (!total) {
				return { items: [], total: 0 };
			}

			// Higher UIDs are typically newer; paginate newest-first.
			const sortedUids = matchedUids.slice().sort((a, b) => b - a);
			const start = (page - 1) * limit;
			const pageUids = sortedUids.slice(start, start + limit);
			const items = await fetchMailboxMessageSummariesByUids(client, pageUids);
			return { items, total };
		}

		const mailbox = client.mailbox;
		const total = typeof mailbox === 'object' && mailbox ? mailbox.exists : 0;

		if (!total) {
			return { items: [], total: 0 };
		}

		const start = Math.max(total - page * limit + 1, 1);
		const end = Math.max(total - (page - 1) * limit, 1);
		const range = start <= end ? `${start}:${end}` : `${end}:${start}`;

		const items: MailboxMessageSummary[] = [];
		for await (const message of client.fetch(
			range,
			{
				uid: true,
				envelope: true,
				flags: true,
				bodyStructure: true
			},
			{ uid: false }
		)) {
			items.push(mapSummary(message));
		}

		items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		return { items, total };
	} finally {
		lock.release();
	}
}

export async function listMailboxMessages(
	userId: string,
	folder: string,
	page: number,
	limit: number,
	options: { query?: string } = {}
): Promise<{ items: MailboxMessageSummary[]; total: number }> {
	return withImapClient(userId, (client) =>
		fetchMailboxMessages(client, folder, page, limit, options.query)
	);
}

/**
 * Messages first so the inbox list can stream before folder STATUS finishes.
 * Uses one pooled session for both steps when called from the API.
 */
export async function listMailboxFolderPage(
	userId: string,
	folder: string,
	page: number,
	limit: number,
	options: { query?: string } = {}
): Promise<{
	folders: MailboxFolder[];
	items: MailboxMessageSummary[];
	total: number;
}> {
	return withImapClient(userId, async (client) => {
		const { items, total } = await fetchMailboxMessages(
			client,
			folder,
			page,
			limit,
			options.query
		);
		const folders = await fetchMailboxFolders(client);
		return { folders, items, total };
	});
}

export async function getMailboxMessage(
	userId: string,
	folder: string,
	uid: number,
	options: { markSeen?: boolean } = {}
): Promise<MailboxMessageDetail | null> {
	return withImapClient(userId, async (client) => {
		const lock = await client.getMailboxLock(folder);

		try {
			const message = await client.fetchOne(
				uid,
				{
					uid: true,
					envelope: true,
					flags: true,
					bodyStructure: true,
					source: true
				},
				{ uid: true }
			);

			if (!message) {
				return null;
			}

			if (!message.source) {
				return null;
			}

			const parsed = await simpleParser(message.source);
			const summary = mapSummary(message);
			let seen = summary.seen;
			const rawHtml = parsed.html ? String(parsed.html) : null;
			const html = rawHtml
				? inlineCidImagesInHtml(rawHtml, parsed.attachments)
				: null;

			if (options.markSeen && !seen) {
				await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
				seen = true;
			}

			return {
				...summary,
				seen,
				cc: formatAddressList(message.envelope?.cc),
				bcc: formatAddressList(message.envelope?.bcc),
				messageId: parsed.messageId ?? null,
				inReplyTo: parsed.inReplyTo ?? null,
				text: parsed.text?.trim() || parsed.textAsHtml?.replace(/<[^>]+>/g, ' ').trim() || '',
				html
			};
		} finally {
			lock.release();
		}
	});
}

const SPECIAL_FOLDER_FALLBACKS: Record<string, string[]> = {
	'\\Archive': ['Archive', 'Archives'],
	'\\Trash': ['Trash', 'Deleted', 'Deleted Messages'],
	'\\Junk': ['Junk', 'Spam', 'Junk E-mail']
};

function resolveSpecialFolderFromMailboxes(
	mailboxes: { path?: string; name?: string; specialUse?: string | null }[],
	specialUse: '\\Archive' | '\\Trash' | '\\Junk'
): string {
	const match = mailboxes.find((mailbox) => mailbox.specialUse === specialUse);
	if (match?.path) {
		return match.path;
	}

	const fallbacks = SPECIAL_FOLDER_FALLBACKS[specialUse] ?? [];
	for (const name of fallbacks) {
		const folder = mailboxes.find(
			(entry) =>
				entry.path?.toLowerCase() === name.toLowerCase() ||
				(entry.name || '').toLowerCase() === name.toLowerCase()
		);
		if (folder?.path) {
			return folder.path;
		}
	}

	throw new Error(`No ${specialUse.replace('\\', '')} folder found in mailbox`);
}

async function resolveMailboxSpecialFolderPath(
	userId: string,
	specialUse: '\\Archive' | '\\Trash' | '\\Junk'
): Promise<string> {
	const folders = await listMailboxFolders(userId);
	return resolveSpecialFolderFromMailboxes(folders, specialUse);
}

export async function updateMailboxMessageFlags(
	userId: string,
	folder: string,
	uid: number,
	flags: { seen?: boolean; flagged?: boolean }
): Promise<void> {
	return withImapClient(userId, async (client) => {
		const lock = await client.getMailboxLock(folder);

		try {
			if (flags.seen === true) {
				await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
			} else if (flags.seen === false) {
				await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
			}

			if (flags.flagged === true) {
				await client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true });
			} else if (flags.flagged === false) {
				await client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true });
			}
		} finally {
			lock.release();
		}
	});
}

export async function moveMailboxMessage(
	userId: string,
	folder: string,
	uid: number,
	destination: string
): Promise<void> {
	return withImapClient(userId, async (client) => {
		const lock = await client.getMailboxLock(folder);

		try {
			await client.messageMove(uid, destination, { uid: true });
		} finally {
			lock.release();
		}
	});
}

export async function performMailboxMessageAction(
	userId: string,
	folder: string,
	uid: number,
	action: 'toggleRead' | 'toggleFlagged' | 'archive' | 'delete' | 'spam'
): Promise<{ type: 'updated'; seen: boolean; flagged: boolean } | { type: 'moved' }> {
	return withImapClient(userId, async (client) => {
		const lock = await client.getMailboxLock(folder);

		try {
			const message = await client.fetchOne(uid, { flags: true }, { uid: true });
			if (!message) {
				throw new Error('Message not found');
			}

			const seen = message.flags?.has('\\Seen') ?? false;
			const flagged = message.flags?.has('\\Flagged') ?? false;

			switch (action) {
				case 'toggleRead': {
					const nextSeen = !seen;
					if (nextSeen) {
						await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
					} else {
						await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
					}

					return { type: 'updated', seen: nextSeen, flagged };
				}
				case 'toggleFlagged': {
					const nextFlagged = !flagged;
					if (nextFlagged) {
						await client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true });
					} else {
						await client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true });
					}

					return { type: 'updated', seen, flagged: nextFlagged };
				}
				case 'archive':
				case 'delete':
				case 'spam': {
					const specialUse =
						action === 'archive' ? '\\Archive' : action === 'delete' ? '\\Trash' : '\\Junk';
					const mailboxes = await client.list();
					const destination = resolveSpecialFolderFromMailboxes(mailboxes, specialUse);
					await client.messageMove(uid, destination, { uid: true });
					return { type: 'moved' };
				}
				default:
					throw new Error('Unsupported mailbox message action');
			}
		} finally {
			lock.release();
		}
	});
}

export async function verifyMailboxConnection(userId: string): Promise<{ ok: boolean; message: string }> {
	const config = await getMailboxConfig(userId);
	if (!config) {
		return { ok: false, message: 'Mailbox is not connected for this user' };
	}

	return verifyMailboxCredentials(config);
}
