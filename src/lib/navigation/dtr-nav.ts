import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';
import { canManageDtr } from '$lib/shared/dtr/access';

export const DTR_SETTINGS_NAV_ITEM: AppNavItem = {
	title: 'Settings',
	href: '/dtr/settings',
	icon: SOLAR.settings,
	match: 'prefix'
};

export const DTR_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Overview',
		href: '/dtr',
		icon: SOLAR.dtr,
		match: 'exact'
	},
	{
		title: 'Time records',
		href: '/dtr/records',
		icon: SOLAR.timeRecords,
		match: 'exact'
	},
	{
		title: 'Upload',
		href: '/dtr/import',
		icon: SOLAR.upload,
		match: 'exact'
	}
];

export function getDtrNavItems(role: string | null | undefined): AppNavItem[] {
	if (!canManageDtr(role)) {
		return [];
	}

	return DTR_NAV_ITEMS;
}
