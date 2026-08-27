import type { PageServerLoad } from './$types';
import { listAccountingAccountsForWorkspace } from '$lib/server/repositories/accounting-accounts';
import { ACCOUNT_TYPE_LABELS } from '$lib/shared/accounting/core/account-types';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageAccounting } = await parent();

	if (!workspace || !canManageAccounting) {
		return { accounts: [], accountTypeLabels: ACCOUNT_TYPE_LABELS };
	}

	const accounts = await listAccountingAccountsForWorkspace(workspace.workspaceId);

	return {
		accounts,
		accountTypeLabels: ACCOUNT_TYPE_LABELS
	};
};
