import type { AppNavItem } from '$lib/navigation/app-nav';
import { canManageDtr } from '$lib/shared/dtr/access';
import ClipboardClockIcon from '@lucide/svelte/icons/clipboard-clock';
import ClockIcon from '@lucide/svelte/icons/clock';
import SettingsIcon from '@lucide/svelte/icons/settings';

export const DTR_SETTINGS_NAV_ITEM: AppNavItem = {
	title: 'Settings',
	href: '/dtr/settings',
	icon: SettingsIcon,
	match: 'prefix'
};

export const DTR_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Overview',
		href: '/dtr',
		icon: ClipboardClockIcon,
		match: 'exact'
	},
	{
		title: 'Time records',
		href: '/dtr/records',
		icon: ClockIcon,
		match: 'exact'
	}
];

export function getDtrNavItems(role: string | null | undefined): AppNavItem[] {
	if (!canManageDtr(role)) {
		return [];
	}

	return DTR_NAV_ITEMS;
}
