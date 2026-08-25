import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';

const WORKSPACE_MEMBER_ROLE_SET = new Set<string>(Object.values(WORKSPACE_MEMBER_ROLES));

export function canManagePayroll(role: string | null | undefined): boolean {
	return (
		role === WORKSPACE_MEMBER_ROLES.OWNER || role === WORKSPACE_MEMBER_ROLES.ADMIN
	);
}

/** Any workspace member with the payroll package can open employee self-service areas. */
export function canAccessPayrollWorkspace(role: string | null | undefined): boolean {
	return Boolean(role && WORKSPACE_MEMBER_ROLE_SET.has(role));
}

export function canViewOwnPayslips(role: string | null | undefined): boolean {
	return canAccessPayrollWorkspace(role);
}
