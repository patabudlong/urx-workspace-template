import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';

const WORKSPACE_MEMBER_ROLE_SET = new Set<string>(Object.values(WORKSPACE_MEMBER_ROLES));

export function canManageAccounting(role: string | null | undefined): boolean {
	return (
		role === WORKSPACE_MEMBER_ROLES.OWNER || role === WORKSPACE_MEMBER_ROLES.ADMIN
	);
}

export function canAccessAccountingWorkspace(role: string | null | undefined): boolean {
	return Boolean(role && WORKSPACE_MEMBER_ROLE_SET.has(role));
}
