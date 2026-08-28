import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import { countAccountingAccountsForWorkspace } from '$lib/server/repositories/accounting-accounts';
import { countAccountingJournalEntriesForWorkspace } from '$lib/server/repositories/accounting-journal-entries';
import { countOpenAccountingPeriodsForWorkspace } from '$lib/server/repositories/accounting-periods';
import { isAccountingConfiguredForWorkspace } from '$lib/server/repositories/accounting-settings';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireAccountingWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const workspaceId = context.workspace.workspaceId;
	const [configured, accountCount, journalCount, openPeriodCount] = await Promise.all([
		isAccountingConfiguredForWorkspace(workspaceId),
		countAccountingAccountsForWorkspace(workspaceId),
		countAccountingJournalEntriesForWorkspace(workspaceId),
		countOpenAccountingPeriodsForWorkspace(workspaceId)
	]);

	return jsonOk(
		{
			enabled: true,
			workspaceId,
			configured,
			accountCount,
			journalCount,
			openPeriodCount
		},
		{ requestId }
	);
};
