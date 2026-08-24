import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';
import { canEditTeamSettings, canViewTeamRoles } from '$lib/shared/team/member-management';

export const TEAM_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Members',
		href: '/team',
		icon: SOLAR.team,
		match: 'exact'
	},
	{
		title: 'Invitations',
		href: '/team/invitations',
		icon: SOLAR.invitations,
		match: 'exact'
	},
	{
		title: 'Roles & permissions',
		href: '/team/roles',
		icon: SOLAR.roles,
		match: 'exact'
	},
	{
		title: 'Workspace settings',
		href: '/team/settings',
		icon: SOLAR.settings,
		match: 'exact'
	}
];

export function getTeamNavItems(role: string | null | undefined): AppNavItem[] {
	return TEAM_NAV_ITEMS.filter((item) => {
		if (item.href === '/team/roles') {
			return canViewTeamRoles(role);
		}

		if (item.href === '/team/settings') {
			return canEditTeamSettings(role);
		}

		return true;
	});
}
