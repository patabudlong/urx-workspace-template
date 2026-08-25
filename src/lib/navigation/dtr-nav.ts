import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';
import { canManageDtr, canViewOwnDtr } from '$lib/shared/dtr/access';

export const DTR_SETTINGS_NAV_ITEM: AppNavItem = {
	title: 'Settings',
	href: '/dtr/settings',
	icon: SOLAR.settings,
	match: 'prefix'
};

export const DTR_ADMIN_NAV_ITEMS: AppNavItem[] = [
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

export const DTR_EMPLOYEE_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'My time',
		href: '/dtr/clock',
		icon: SOLAR.timeRecords,
		match: 'exact'
	}
];

/** @deprecated Use getDtrNavItems */
export const DTR_NAV_ITEMS = DTR_ADMIN_NAV_ITEMS;

export function getDtrNavItems(
	role: string | null | undefined,
	hasLinkedEmployee = false
): AppNavItem[] {
	if (canManageDtr(role)) {
		return [
			...DTR_ADMIN_NAV_ITEMS,
			{
				title: 'Clock in/out',
				href: '/dtr/clock',
				icon: SOLAR.timeRecords,
				match: 'exact'
			}
		];
	}

	if (canViewOwnDtr(role) && hasLinkedEmployee) {
		return DTR_EMPLOYEE_NAV_ITEMS;
	}

	return [];
}
