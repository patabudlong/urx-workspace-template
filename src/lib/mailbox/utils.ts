import type { Component } from 'svelte';
import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
import ArchiveIcon from '@lucide/svelte/icons/archive';
import FileIcon from '@lucide/svelte/icons/file';
import FolderIcon from '@lucide/svelte/icons/folder';
import InboxIcon from '@lucide/svelte/icons/inbox';
import SendIcon from '@lucide/svelte/icons/send';
import Trash2Icon from '@lucide/svelte/icons/trash-2';

const SPECIAL_FOLDER_LABELS: Record<string, string> = {
	'\\Inbox': 'Inbox',
	'\\Sent': 'Sent',
	'\\Drafts': 'Drafts',
	'\\Trash': 'Trash',
	'\\Junk': 'Spam',
	'\\Archive': 'Archive'
};

const MAILBOX_FOLDER_SORT_ORDER: Record<string, number> = {
	'\\Inbox': 0,
	'\\Drafts': 1,
	'\\Sent': 2,
	'\\Archive': 3,
	'\\Junk': 4,
	'\\Trash': 5
};

const MAILBOX_FOLDER_NAME_ORDER: Record<string, number> = {
	inbox: 0,
	drafts: 1,
	sent: 2,
	archive: 3,
	junk: 4,
	spam: 4,
	trash: 5
};

function getMailboxFolderSortIndex(folder: MailboxFolder): number {
	if (folder.specialUse && folder.specialUse in MAILBOX_FOLDER_SORT_ORDER) {
		return MAILBOX_FOLDER_SORT_ORDER[folder.specialUse];
	}

	const key = (folder.name || folder.path).trim().toLowerCase();
	return MAILBOX_FOLDER_NAME_ORDER[key] ?? 100;
}

export function isMailboxInboxPath(path: string): boolean {
	return path.toUpperCase() === 'INBOX';
}

export function isMailboxInboxFolder(folder: MailboxFolder): boolean {
	return folder.specialUse === '\\Inbox' || isMailboxInboxPath(folder.path);
}

export function findMailboxInboxFolder(folders: MailboxFolder[]): MailboxFolder | undefined {
	return folders.find(isMailboxInboxFolder);
}

export function partitionMailboxFolders(folders: MailboxFolder[]): {
	inbox: MailboxFolder | null;
	folders: MailboxFolder[];
} {
	const inbox = findMailboxInboxFolder(folders) ?? null;
	const others = folders.filter((folder) => !isMailboxInboxFolder(folder));

	return {
		inbox,
		folders: sortMailboxFolders(others)
	};
}

export function sortMailboxFolders(folders: MailboxFolder[]): MailboxFolder[] {
	return [...folders].sort((a, b) => {
		const orderA = getMailboxFolderSortIndex(a);
		const orderB = getMailboxFolderSortIndex(b);

		if (orderA !== orderB) {
			return orderA - orderB;
		}

		return (a.name || a.path).localeCompare(b.name || b.path);
	});
}

export function encodeMailboxFolder(path: string): string {
	return encodeURIComponent(path);
}

export function decodeMailboxFolder(encoded: string): string {
	return decodeURIComponent(encoded);
}

export function getMailboxFolderIcon(folder: MailboxFolder): Component {
	switch (folder.specialUse) {
		case '\\Inbox':
			return InboxIcon;
		case '\\Sent':
			return SendIcon;
		case '\\Drafts':
			return FileIcon;
		case '\\Trash':
			return Trash2Icon;
		case '\\Archive':
			return ArchiveIcon;
		default:
			return FolderIcon;
	}
}

export function getMailboxFolderLabel(folder: MailboxFolder): string {
	if (folder.specialUse && SPECIAL_FOLDER_LABELS[folder.specialUse]) {
		return SPECIAL_FOLDER_LABELS[folder.specialUse];
	}

	return folder.name || folder.path;
}

export function formatMailboxDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return '';
	}

	const now = new Date();
	const sameDay =
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate();

	if (sameDay) {
		return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	}

	const sameYear = date.getFullYear() === now.getFullYear();
	if (sameYear) {
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function parseMailboxAddress(value: string): { name: string; email: string } {
	const trimmed = value.trim();
	if (!trimmed) {
		return { name: 'Unknown sender', email: '' };
	}

	const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
	if (angleMatch) {
		const name = angleMatch[1].replace(/^"|"$/g, '').trim();
		return { name: name || angleMatch[2].trim(), email: angleMatch[2].trim() };
	}

	if (trimmed.includes('@')) {
		const localPart = trimmed.split('@')[0] ?? trimmed;
		return { name: localPart, email: trimmed };
	}

	return { name: trimmed, email: '' };
}

export function getMailboxAddressLabel(value: string): string {
	const { name, email } = parseMailboxAddress(value);
	if (name && email && name !== email) {
		return name;
	}

	return email || name || 'Unknown sender';
}

export function getMailboxAddressInitials(value: string): string {
	const label = getMailboxAddressLabel(value);
	const parts = label.split(/\s+/).filter(Boolean);

	if (parts.length >= 2) {
		return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
	}

	return label.slice(0, 2).toUpperCase() || '?';
}

export function parseRecipientInput(value: string): string[] {
	return value
		.split(/[,;]/)
		.map((entry) => entry.trim())
		.filter(Boolean);
}

export function buildMailboxEmailSrcdoc(html: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<base target="_blank" rel="noopener noreferrer">
<style>
	html, body {
		margin: 0;
		padding: 0;
		background: #ffffff;
	}
	body {
		padding: 1.25rem 1.5rem;
		overflow-wrap: anywhere;
		word-break: break-word;
		font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		font-size: 15px;
		line-height: 1.65;
		color: #18181b;
		-webkit-font-smoothing: antialiased;
	}
	p, li, td, th, blockquote {
		line-height: 1.65;
	}
	h1, h2, h3, h4, h5, h6 {
		line-height: 1.3;
		margin-top: 1.25em;
		margin-bottom: 0.5em;
	}
	a {
		color: #2563eb;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	img, video {
		max-width: 100%;
		height: auto;
	}
	table {
		max-width: 100%;
		border-collapse: collapse;
	}
	td, th {
		word-break: break-word;
		vertical-align: top;
	}
	pre {
		white-space: pre-wrap;
		overflow-x: auto;
	}
	blockquote {
		margin: 1em 0;
		padding-left: 1em;
		border-left: 3px solid #e4e4e7;
		color: #52525b;
	}
</style>
</head>
<body>${html}</body>
</html>`;
}
