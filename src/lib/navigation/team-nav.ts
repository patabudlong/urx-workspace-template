import type { AppNavItem } from '$lib/navigation/app-nav';
import { isWorkspaceOwner } from '$lib/navigation/app-nav';
import KeyRoundIcon from '@lucide/svelte/icons/key-round';
import MailIcon from '@lucide/svelte/icons/mail';
import UsersIcon from '@lucide/svelte/icons/users';

export const TEAM_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Members',
		href: '/team',
		icon: UsersIcon,
		match: 'exact'
	},
	{
		title: 'Invitations',
		href: '/team/invitations',
		icon: MailIcon,
		match: 'exact'
	},
	{
		title: 'Roles & permissions',
		href: '/team/roles',
		icon: KeyRoundIcon,
		match: 'exact'
	}
];

export function getTeamNavItems(role: string | null | undefined): AppNavItem[] {
	return TEAM_NAV_ITEMS.filter((item) => {
		if (item.href === '/team/roles') {
			return isWorkspaceOwner(role);
		}

		return true;
	});
}
