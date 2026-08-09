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

	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function parseRecipientInput(value: string): string[] {
	return value
		.split(/[,;]/)
		.map((entry) => entry.trim())
		.filter(Boolean);
}
