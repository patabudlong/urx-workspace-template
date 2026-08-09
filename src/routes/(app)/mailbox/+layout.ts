import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
import { fetchMailboxFolders } from '$lib/mailbox/client';

export const load: LayoutLoad = async ({ data, fetch, params, depends }) => {
	depends('mailbox:folders');

	if (!data.configured) {
		return {
			connection: data.connection,
			configured: false as const,
			signature: data.signature,
			folders: Promise.resolve([]) as Promise<MailboxFolder[]>
		};
	}

	// Folder routes stream messages + folders from [folder]/+layout.server.ts.
	// Track `params.folder` only — never `url.pathname`, or this re-runs on every
	// message open (/mailbox/INBOX → /mailbox/INBOX/123) and stalls navigation.
	if (params.folder) {
		return {
			connection: data.connection,
			configured: true as const,
			signature: data.signature
		};
	}

	const folders = fetchMailboxFolders({ fetch });

	return {
		connection: data.connection,
		configured: true as const,
		signature: data.signature,
		// SSR: await so settings/compose HTML includes the sidebar. Client nav: stream.
		folders: browser ? folders : await folders
	};
};
