import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';

export const SECURITY_NAV_ITEM: AppNavItem = {
	title: 'Security',
	href: '/security/password',
	icon: SOLAR.security,
	match: 'prefix',
	activeHref: '/security'
};

export const SECURITY_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Password & login',
		href: '/security/password',
		icon: SOLAR.roles,
		match: 'exact'
	},
	{
		title: 'Two-factor authentication',
		href: '/security/two-factor',
		icon: SOLAR.fingerprint,
		match: 'exact'
	},
	{
		title: 'Recent activity',
		href: '/security/activity',
		icon: SOLAR.activity,
		match: 'prefix',
		activeHref: '/security/activity'
	}
];
