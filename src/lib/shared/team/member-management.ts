import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';

export function canInviteWorkspaceMembers(role: string | null | undefined): boolean {
	return canRemoveWorkspaceMembers(role);
}

export function canRemoveWorkspaceMembers(role: string | null | undefined): boolean {
	return (
		role === WORKSPACE_MEMBER_ROLES.OWNER || role === WORKSPACE_MEMBER_ROLES.ADMIN
	);
}

export function canRemoveWorkspaceMember(input: {
	actorRole: string;
	targetRole: string;
}): boolean {
	if (!canRemoveWorkspaceMembers(input.actorRole)) {
		return false;
	}

	return input.targetRole !== WORKSPACE_MEMBER_ROLES.OWNER;
}
