import {
	WORKSPACE_MEMBER_ROLES,
	type WorkspaceMemberRole
} from '$lib/shared/models/workspace-member';

export type TeamPermissionLevel = 'yes' | 'no' | 'limited';

export type TeamRoleOverview = {
	role: WorkspaceMemberRole;
	label: string;
	/** Dropdown description when inviting members */
	inviteDescription: string;
	shortDescription: string;
	tooltip: string;
	explanation: string;
	manageMembers: TeamPermissionLevel;
	editTeamSettings: TeamPermissionLevel;
	createEditAllContent: TeamPermissionLevel;
	viewAllTeamContent: TeamPermissionLevel;
	accessOnlyAssigned: TeamPermissionLevel;
};

export type TeamPermissionMatrixRow = {
	label: string;
	group?: string;
	permissions: Record<WorkspaceMemberRole, TeamPermissionLevel>;
};

export const TEAM_ROLE_OVERVIEW: readonly TeamRoleOverview[] = [
	{
		role: WORKSPACE_MEMBER_ROLES.OWNER,
		label: 'Owner',
		inviteDescription: '',
		shortDescription:
			'Full unrestricted control; can transfer ownership or delete the team',
		tooltip: 'Full control over team, settings, billing & ownership',
		explanation:
			'Complete unrestricted authority over the entire team and platform. You can manage all members, adjust all settings, create and edit any content or service, view everything, transfer ownership, or permanently delete the team.',
		manageMembers: 'yes',
		editTeamSettings: 'yes',
		createEditAllContent: 'yes',
		viewAllTeamContent: 'yes',
		accessOnlyAssigned: 'no'
	},
	{
		role: WORKSPACE_MEMBER_ROLES.ADMIN,
		label: 'Admin',
		inviteDescription: 'Manage team, settings & all content',
		shortDescription:
			'Manage members, settings & all team content — cannot transfer ownership',
		tooltip: 'Manage members, settings & all content/services',
		explanation:
			'Full team and content management access — you can add or remove members, change team settings, and create/edit all content and services. You cannot transfer ownership or delete the team.',
		manageMembers: 'yes',
		editTeamSettings: 'yes',
		createEditAllContent: 'yes',
		viewAllTeamContent: 'yes',
		accessOnlyAssigned: 'no'
	},
	{
		role: WORKSPACE_MEMBER_ROLES.EDITOR,
		label: 'Editor',
		inviteDescription: 'Create & edit all content & services',
		shortDescription:
			'Create & edit all shared content & services — no team management',
		tooltip: 'Create, edit & delete all content & services',
		explanation:
			'Full ability to create, update, and delete all shared content, services, and records. You cannot manage team members or modify team settings.',
		manageMembers: 'no',
		editTeamSettings: 'no',
		createEditAllContent: 'yes',
		viewAllTeamContent: 'yes',
		accessOnlyAssigned: 'no'
	},
	{
		role: WORKSPACE_MEMBER_ROLES.MEMBER,
		label: 'Member',
		inviteDescription: 'Collaborate on assigned work & services',
		shortDescription:
			'Collaborate on assigned content & services — limited editing rights',
		tooltip: 'Collaborate on assigned work & own items',
		explanation:
			'Can collaborate on assigned work, add edits, and contribute to assigned content and services. Cannot edit or modify other team members’ work or manage team settings.',
		manageMembers: 'no',
		editTeamSettings: 'no',
		createEditAllContent: 'limited',
		viewAllTeamContent: 'yes',
		accessOnlyAssigned: 'no'
	},
	{
		role: WORKSPACE_MEMBER_ROLES.VIEWER,
		label: 'Viewer',
		inviteDescription: 'View & comment only — no edits',
		shortDescription: 'View & comment only — cannot edit any content or services',
		tooltip: 'View & comment only — no editing rights',
		explanation:
			'Can view all team content and services and leave comments — but cannot make any edits, changes, or uploads of any kind.',
		manageMembers: 'no',
		editTeamSettings: 'no',
		createEditAllContent: 'no',
		viewAllTeamContent: 'yes',
		accessOnlyAssigned: 'no'
	},
	{
		role: WORKSPACE_MEMBER_ROLES.GUEST,
		label: 'Guest',
		inviteDescription: 'Access only shared content',
		shortDescription:
			'Limited external access — only sees what you explicitly share',
		tooltip: 'Access only content explicitly shared with you',
		explanation:
			'Limited external access — you will only see the specific content, services, or items explicitly shared with you by the team. No access to the full team workspace or member list.',
		manageMembers: 'no',
		editTeamSettings: 'no',
		createEditAllContent: 'limited',
		viewAllTeamContent: 'limited',
		accessOnlyAssigned: 'yes'
	}
] as const;

export const TEAM_PERMISSION_MATRIX: readonly TeamPermissionMatrixRow[] = [
	{
		label: 'Invite / remove members',
		group: 'Team & member management',
		permissions: {
			owner: 'yes',
			admin: 'yes',
			editor: 'no',
			member: 'no',
			viewer: 'no',
			guest: 'no'
		}
	},
	{
		label: 'Assign / change roles',
		group: 'Team & member management',
		permissions: {
			owner: 'yes',
			admin: 'yes',
			editor: 'no',
			member: 'no',
			viewer: 'no',
			guest: 'no'
		}
	},
	{
		label: 'Edit team name, settings & branding',
		group: 'Team & member management',
		permissions: {
			owner: 'yes',
			admin: 'yes',
			editor: 'no',
			member: 'no',
			viewer: 'no',
			guest: 'no'
		}
	},
	{
		label: 'Transfer team ownership',
		group: 'Team & member management',
		permissions: {
			owner: 'yes',
			admin: 'no',
			editor: 'no',
			member: 'no',
			viewer: 'no',
			guest: 'no'
		}
	},
	{
		label: 'Delete / archive entire team',
		group: 'Team & member management',
		permissions: {
			owner: 'yes',
			admin: 'no',
			editor: 'no',
			member: 'no',
			viewer: 'no',
			guest: 'no'
		}
	},
	{
		label: 'Create new content / services',
		group: 'Content & services',
		permissions: {
			owner: 'yes',
			admin: 'yes',
			editor: 'yes',
			member: 'limited',
			viewer: 'no',
			guest: 'limited'
		}
	},
	{
		label: 'Edit any existing content / services',
		group: 'Content & services',
		permissions: {
			owner: 'yes',
			admin: 'yes',
			editor: 'yes',
			member: 'limited',
			viewer: 'no',
			guest: 'limited'
		}
	},
	{
		label: 'Delete any content / services',
		group: 'Content & services',
		permissions: {
			owner: 'yes',
			admin: 'yes',
			editor: 'yes',
			member: 'limited',
			viewer: 'no',
			guest: 'no'
		}
	},
	{
		label: 'View all team content / services',
		group: 'Content & services',
		permissions: {
			owner: 'yes',
			admin: 'yes',
			editor: 'yes',
			member: 'yes',
			viewer: 'yes',
			guest: 'no'
		}
	},
	{
		label: 'See full team member list',
		group: 'Access scope',
		permissions: {
			owner: 'yes',
			admin: 'yes',
			editor: 'yes',
			member: 'yes',
			viewer: 'yes',
			guest: 'no'
		}
	},
	{
		label: 'Access only assigned / shared items',
		group: 'Access scope',
		permissions: {
			owner: 'no',
			admin: 'no',
			editor: 'no',
			member: 'no',
			viewer: 'no',
			guest: 'yes'
		}
	},
	{
		label: 'View billing & subscription details',
		group: 'Access scope',
		permissions: {
			owner: 'yes',
			admin: 'no',
			editor: 'no',
			member: 'no',
			viewer: 'no',
			guest: 'no'
		}
	}
] as const;

export const TEAM_MATRIX_ROLE_COLUMNS: readonly WorkspaceMemberRole[] = [
	WORKSPACE_MEMBER_ROLES.OWNER,
	WORKSPACE_MEMBER_ROLES.ADMIN,
	WORKSPACE_MEMBER_ROLES.EDITOR,
	WORKSPACE_MEMBER_ROLES.MEMBER,
	WORKSPACE_MEMBER_ROLES.VIEWER,
	WORKSPACE_MEMBER_ROLES.GUEST
];

export function findTeamRoleOverview(
	role: string | null | undefined
): TeamRoleOverview | undefined {
	return TEAM_ROLE_OVERVIEW.find((entry) => entry.role === role);
}

export function getTeamRoleTooltip(role: string | null | undefined): string | undefined {
	return findTeamRoleOverview(role)?.tooltip;
}
