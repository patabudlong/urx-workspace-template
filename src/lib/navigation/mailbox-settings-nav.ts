import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';

export const MAILBOX_SETTINGS_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Connection',
		href: '/mailbox/settings/connection',
		icon: SOLAR.mailConnection,
		match: 'exact'
	},
	{
		title: 'Signature',
		href: '/mailbox/settings/signature',
		icon: SOLAR.signature,
		match: 'exact'
	}
];
