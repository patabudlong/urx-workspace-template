import type { AppNavItem } from '$lib/navigation/app-nav';
import SettingsIcon from '@lucide/svelte/icons/settings';

export const MAILBOX_SETTINGS_NAV_ITEM: AppNavItem = {
	title: 'Settings',
	href: '/mailbox/settings',
	icon: SettingsIcon,
	match: 'prefix'
};
