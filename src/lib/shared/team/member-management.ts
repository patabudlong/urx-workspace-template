import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';

export function canInviteWorkspaceMembers(role: string | null | undefined): boolean {
	return canRemoveWorkspaceMembers(role);
}

export function canViewTeamRoles(role: string | null | undefined): boolean {
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

export function canUpdateWorkspaceMembers(role: string | null | undefined): boolean {
	return canRemoveWorkspaceMembers(role);
}

export function canUpdateWorkspaceMember(input: {
	actorRole: string;
	actorUserId: string;
	targetUserId: string;
	targetRole: string;
}): boolean {
	if (!canUpdateWorkspaceMemberTarget({ actorRole: input.actorRole, targetRole: input.targetRole })) {
		return false;
	}

	return input.actorUserId !== input.targetUserId;
}

export function canUpdateWorkspaceMemberTarget(input: {
	actorRole: string;
	targetRole: string;
}): boolean {
	return canRemoveWorkspaceMember(input);
}
