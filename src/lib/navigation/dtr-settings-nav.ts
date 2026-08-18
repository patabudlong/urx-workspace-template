import type { AppNavItem } from '$lib/navigation/app-nav';
import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';

export const DTR_SETTINGS_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Workspace default',
		href: '/dtr/settings',
		icon: CalendarClockIcon,
		match: 'exact'
	},
	{
		title: 'Named schedules',
		href: '/dtr/settings/schedules',
		icon: CalendarDaysIcon,
		match: 'exact'
	}
];
