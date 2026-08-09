import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createImapClient } from './verify';
import { sortMailboxFolders } from '$lib/mailbox/utils';
import type { MailboxFolder, MailboxMessageDetail, MailboxMessageSummary } from '$lib/shared/mailbox/schemas';
import { getMailboxConfig } from './config';
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

async function withImapClient<T>(userId: string, fn: (client: ImapFlow) => Promise<T>): Promise<T> {
	const config = await getMailboxConfig(userId);
	if (!config) {
		throw new Error('Mailbox is not configured');
	}

	const client = createImapClient(config);

	await client.connect();

	try {
		return await fn(client);
	} finally {
		await client.logout();
	}
}

export async function listMailboxFolders(userId: string): Promise<MailboxFolder[]> {
	return withImapClient(userId, async (client) => {
		const folders: MailboxFolder[] = [];

		const mailboxes = await client.list();

		for (const mailbox of mailboxes) {
			if (!mailbox.path) {
				continue;
			}

			let unseen = 0;
			let totalMessages = 0;
			try {
				const status = await client.status(mailbox.path, { unseen: true, messages: true });
				unseen = status.unseen ?? 0;
				totalMessages = status.messages ?? 0;
			} catch {
				// Some folders may not be selectable.
			}

			folders.push({
				path: mailbox.path,
				name: mailbox.name || mailbox.path,
				specialUse: mailbox.specialUse ?? null,
				unseen,
				total: totalMessages
			});
		}

		return sortMailboxFolders(folders);
	});
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

export async function listMailboxMessages(
	userId: string,
	folder: string,
	page: number,
	limit: number
): Promise<{ items: MailboxMessageSummary[]; total: number }> {
	return withImapClient(userId, async (client) => {
		const lock = await client.getMailboxLock(folder);

		try {
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
	});
}

export async function getMailboxMessage(
	userId: string,
	folder: string,
	uid: number
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

			return {
				...summary,
				cc: formatAddressList(message.envelope?.cc),
				bcc: formatAddressList(message.envelope?.bcc),
				messageId: parsed.messageId ?? null,
				inReplyTo: parsed.inReplyTo ?? null,
				text: parsed.text?.trim() || parsed.textAsHtml?.replace(/<[^>]+>/g, ' ').trim() || '',
				html: parsed.html ? String(parsed.html) : null
			};
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
