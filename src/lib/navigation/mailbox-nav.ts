import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';

export const MAILBOX_SETTINGS_NAV_ITEM: AppNavItem = {
	title: 'Settings',
	href: '/mailbox/settings',
	icon: SOLAR.settings,
	match: 'prefix'
};
