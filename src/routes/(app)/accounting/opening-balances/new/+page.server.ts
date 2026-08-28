import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { listAccountingAccountsForWorkspace } from '$lib/server/repositories/accounting-accounts';
import {
	createAccountingJournalEntryForWorkspace,
	hasOpeningBalanceForPeriod
} from '$lib/server/repositories/accounting-journal-entries';
import { getFirstFiscalPeriodForWorkspace } from '$lib/server/repositories/accounting-periods';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageAccounting } from '$lib/shared/accounting/access';
import { createJournalEntrySchema } from '$lib/shared/accounting/core/journal-validation';
import { ACCOUNTING_OPENING_BALANCE_SAVE_FAILED_MESSAGE } from '$lib/shared/accounting/messages';
import { parsePhpToCents } from '$lib/shared/accounting/money';
import { journalFormSchema } from '$lib/shared/accounting/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageAccounting: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(journalFormSchema), {
				defaults: {
					periodId: '',
					entryDate: new Date().toISOString().slice(0, 10),
					reference: 'OB',
					memo: 'Opening balances',
					lines: [
						{ accountId: '', description: '', debit: '', credit: '' },
						{ accountId: '', description: '', debit: '', credit: '' }
					]
				}
			}),
			accounts: [],
			firstPeriod: null
		};
	}

	const workspaceId = workspace.workspaceId;
	const [accounts, firstPeriod] = await Promise.all([
		listAccountingAccountsForWorkspace(workspaceId),
		getFirstFiscalPeriodForWorkspace(workspaceId)
	]);

	if (!firstPeriod) {
		throw error(400, 'Complete company setup to create fiscal periods first.');
	}

	const hasOpeningBalance = await hasOpeningBalanceForPeriod({
		workspaceId,
		periodId: firstPeriod.id
	});

	if (hasOpeningBalance || firstPeriod.status !== 'open') {
		throw redirect(303, '/accounting/opening-balances');
	}

	return {
		form: await superValidate(zod4(journalFormSchema), {
			defaults: {
				periodId: firstPeriod.id,
				entryDate: firstPeriod.startDate,
				reference: 'OB',
				memo: 'Opening balances',
				lines: [
					{ accountId: '', description: '', debit: '', credit: '' },
					{ accountId: '', description: '', debit: '', credit: '' }
				]
			}
		}),
		accounts,
		firstPeriod
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(journalFormSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageAccounting(workspace.role)) {
			return fail(403, { form, message: 'Accounting access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		const lines = form.data.lines.map((line) => ({
			accountId: line.accountId,
			description: line.description ?? '',
			debitCents: parsePhpToCents(line.debit ?? '') ?? 0,
			creditCents: parsePhpToCents(line.credit ?? '') ?? 0
		}));

		const parsed = createJournalEntrySchema.safeParse({
			periodId: form.data.periodId,
			entryDate: form.data.entryDate,
			reference: form.data.reference,
			memo: form.data.memo,
			source: 'opening_balance',
			lines
		});

		if (!parsed.success) {
			return fail(400, {
				form,
				message: parsed.error.issues[0]?.message ?? 'Invalid opening balance entry'
			});
		}

		try {
			const entry = await createAccountingJournalEntryForWorkspace({
				workspaceId: workspace.workspaceId,
				userId: locals.user.id,
				data: parsed.data
			});

			throw redirect(303, `/accounting/journals/${entry.id}`);
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}

			return message(
				form,
				error instanceof Error ? error.message : ACCOUNTING_OPENING_BALANCE_SAVE_FAILED_MESSAGE,
				{ status: 500 }
			);
		}
	}
};
