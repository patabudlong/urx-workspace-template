import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';

export const DTR_SETTINGS_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Workspace default',
		href: '/dtr/settings',
		icon: SOLAR.dtrDefault,
		match: 'exact'
	},
	{
		title: 'Named schedules',
		href: '/dtr/settings/schedules',
		icon: SOLAR.dtrSchedules,
		match: 'exact'
	},
	{
		title: 'Holiday calendar',
		href: '/dtr/settings/holidays',
		icon: SOLAR.dtrHolidays,
		match: 'exact'
	}
];
