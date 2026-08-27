import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireAccountingWorkspace } from '$lib/server/accounting/api-context';
import {
	createAccountingJournalEntryForWorkspace,
	listAccountingJournalEntriesForWorkspace
} from '$lib/server/repositories/accounting-journal-entries';
import { createJournalEntrySchema } from '$lib/shared/accounting/core/journal-validation';
import type { AccountingJournalSource } from '$lib/shared/accounting/journal-sources';
import { ACCOUNTING_JOURNAL_SOURCES } from '$lib/shared/accounting/journal-sources';

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

	const periodId = url.searchParams.get('periodId') ?? undefined;
	const sourceParam = url.searchParams.get('source');
	const source = ACCOUNTING_JOURNAL_SOURCES.includes(sourceParam as AccountingJournalSource)
		? (sourceParam as AccountingJournalSource)
		: undefined;
	const entries = await listAccountingJournalEntriesForWorkspace({
		workspaceId: context.workspace.workspaceId,
		periodId,
		source
	});

	return jsonOk({ entries }, { requestId });
};

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireAccountingWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	if (!locals.user?.id) {
		return jsonError('UNAUTHORIZED', 'Authentication required', { requestId });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = createJournalEntrySchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	try {
		const entry = await createAccountingJournalEntryForWorkspace({
			workspaceId: context.workspace.workspaceId,
			userId: locals.user.id,
			data: parsed.data
		});

		return jsonOk({ entry }, { requestId, status: 201 });
	} catch (error) {
		return jsonError('BAD_REQUEST', error instanceof Error ? error.message : 'Could not post journal', {
			requestId
		});
	}
};
