import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
import { fetchMailboxFolders } from '$lib/mailbox/client';

export const load: LayoutLoad = async ({ data, fetch, params }) => {
	if (!data.configured) {
		return {
			connection: data.connection,
			configured: false as const,
			folders: Promise.resolve([]) as Promise<MailboxFolder[]>
		};
	}

	// Folder routes load folders with messages in one server-streamed request.
	// Track `params.folder` only — never `url.pathname`, or this re-runs on every
	// message open (/mailbox/INBOX → /mailbox/INBOX/123) and stalls navigation.
	if (params.folder) {
		return {
			connection: data.connection,
			configured: true as const
		};
	}

	const folders = fetchMailboxFolders({ fetch });

	return {
		connection: data.connection,
		configured: true as const,
		// SSR: await so settings/compose HTML includes the sidebar. Client nav: stream.
		folders: browser ? folders : await folders
	};
};
