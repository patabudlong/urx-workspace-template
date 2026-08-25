import { canManagePayroll, canAccessPayrollWorkspace } from '$lib/shared/payroll/access';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import { requireWorkspaceModuleApiContext } from '$lib/server/workspace-packages/access';

type PayrollApiContextResult =
	| {
			ok: true;
			workspace: WorkspaceContext;
			requestId?: string;
	  }
	| {
			ok: false;
			response: Response;
	  };

export async function requirePayrollWorkspace(input: {
	userId: string | undefined;
	url: URL;
	requestId?: string;
}): Promise<PayrollApiContextResult> {
	return requireWorkspaceModuleApiContext({
		...input,
		packageId: WORKSPACE_PACKAGE_IDS.PAYROLL,
		requireRole: canManagePayroll,
		forbiddenMessage: 'Payroll access required'
	});
}

export async function requirePayrollMemberWorkspace(input: {
	userId: string | undefined;
	url: URL;
	requestId?: string;
}): Promise<PayrollApiContextResult> {
	return requireWorkspaceModuleApiContext({
		...input,
		packageId: WORKSPACE_PACKAGE_IDS.PAYROLL,
		requireRole: canAccessPayrollWorkspace,
		forbiddenMessage: 'Workspace membership required'
	});
}
