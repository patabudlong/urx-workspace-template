export const TEAM_INVITE_ROLE_VALUES = ['admin', 'editor', 'member', 'viewer', 'guest'] as const;

export type TeamInviteRole = (typeof TEAM_INVITE_ROLE_VALUES)[number];

export type TeamInviteRoleOption = {
	value: TeamInviteRole;
	label: string;
	description: string;
};

export const TEAM_INVITE_ROLE_OPTIONS: readonly TeamInviteRoleOption[] = [
	{
		value: 'admin',
		label: 'Admin',
		description: 'Manage team, settings & all content'
	},
	{
		value: 'editor',
		label: 'Editor',
		description: 'Create & edit all content & services'
	},
	{
		value: 'member',
		label: 'Member',
		description: 'Collaborate on assigned work & services'
	},
	{
		value: 'viewer',
		label: 'Viewer',
		description: 'View & comment only — no edits'
	},
	{
		value: 'guest',
		label: 'Guest',
		description: 'Access only shared content'
	}
] as const;

export const DEFAULT_TEAM_INVITE_ROLE: TeamInviteRole = 'member';

export function findTeamInviteRoleOption(
	role: string | null | undefined
): TeamInviteRoleOption | undefined {
	return TEAM_INVITE_ROLE_OPTIONS.find((option) => option.value === role);
}
