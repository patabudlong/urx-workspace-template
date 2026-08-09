import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import { TEAM_ROLE_OVERVIEW } from '$lib/shared/team/role-permissions';

export const TEAM_INVITE_ROLE_VALUES = ['admin', 'editor', 'member', 'viewer', 'guest'] as const;

export type TeamInviteRole = (typeof TEAM_INVITE_ROLE_VALUES)[number];

export type TeamInviteRoleOption = {
	value: TeamInviteRole;
	label: string;
	description: string;
	tooltip: string;
};

const inviteableOverview = TEAM_ROLE_OVERVIEW.filter(
	(entry) => entry.role !== WORKSPACE_MEMBER_ROLES.OWNER
);

export const TEAM_INVITE_ROLE_OPTIONS: readonly TeamInviteRoleOption[] = inviteableOverview.map(
	(entry) => ({
		value: entry.role as TeamInviteRole,
		label: entry.label,
		description: entry.inviteDescription,
		tooltip: entry.tooltip
	})
);

export const DEFAULT_TEAM_INVITE_ROLE: TeamInviteRole = 'member';

export function findTeamInviteRoleOption(
	role: string | null | undefined
): TeamInviteRoleOption | undefined {
	return TEAM_INVITE_ROLE_OPTIONS.find((option) => option.value === role);
}
