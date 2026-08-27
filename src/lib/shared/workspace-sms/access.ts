import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';

export function canManageSms(role: string | null | undefined): boolean {
	return role === WORKSPACE_MEMBER_ROLES.OWNER || role === WORKSPACE_MEMBER_ROLES.ADMIN;
}
