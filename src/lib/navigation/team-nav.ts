import type { AppNavItem } from '$lib/navigation/app-nav';
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
	}
];
