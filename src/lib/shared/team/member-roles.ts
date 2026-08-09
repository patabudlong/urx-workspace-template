import { WORKSPACE_MEMBER_ROLES, type WorkspaceMemberRole } from '$lib/shared/models/workspace-member';
import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';

const WORKSPACE_MEMBER_ROLE_LABELS: Record<WorkspaceMemberRole, string> = {
	[WORKSPACE_MEMBER_ROLES.OWNER]: 'Owner',
	[WORKSPACE_MEMBER_ROLES.ADMIN]: 'Admin',
	[WORKSPACE_MEMBER_ROLES.EDITOR]: 'Editor',
	[WORKSPACE_MEMBER_ROLES.MEMBER]: 'Member',
	[WORKSPACE_MEMBER_ROLES.VIEWER]: 'Viewer',
	[WORKSPACE_MEMBER_ROLES.GUEST]: 'Guest'
};

export function getWorkspaceMemberRoleLabel(role: string): string {
	if (role in WORKSPACE_MEMBER_ROLE_LABELS) {
		return WORKSPACE_MEMBER_ROLE_LABELS[role as WorkspaceMemberRole];
	}

	return findTeamInviteRoleOption(role)?.label ?? role;
}
