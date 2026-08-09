import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMailboxMessage, isMailboxConfigured } from '$lib/server/mailbox';
import { decodeMailboxFolder } from '$lib/mailbox/utils';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!(await isMailboxConfigured(locals.user!.id))) {
		redirect(303, '/mailbox/settings');
	}

	const folder = decodeMailboxFolder(params.folder);
	const uid = Number(params.uid);

	if (!Number.isFinite(uid) || uid <= 0) {
		throw error(400, 'Invalid message id');
	}

	try {
		const message = await getMailboxMessage(locals.user!.id, folder, uid);
		if (!message) {
			throw error(404, 'Message not found');
		}

		return { folder, message };
	} catch (loadError) {
		if (loadError && typeof loadError === 'object' && 'status' in loadError) {
			throw loadError;
		}

		const message = loadError instanceof Error ? loadError.message : 'Failed to load message';
		throw error(503, message);
	}
};
