import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAccountingJournalEntryForWorkspace } from '$lib/server/repositories/accounting-journal-entries';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { workspace, canManageAccounting } = await parent();

	if (!workspace || !canManageAccounting) {
		throw error(403, 'Accounting access required');
	}

	const entry = await getAccountingJournalEntryForWorkspace({
		workspaceId: workspace.workspaceId,
		entryId: params.id
	});

	if (!entry) {
		throw error(404, 'Journal entry not found');
	}

	return { entry };
};
