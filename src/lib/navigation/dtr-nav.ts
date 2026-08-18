import type { AppNavItem } from '$lib/navigation/app-nav';
import { canManageDtr } from '$lib/shared/dtr/access';
import ClipboardClockIcon from '@lucide/svelte/icons/clipboard-clock';
import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
import ClockIcon from '@lucide/svelte/icons/clock';

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
	},
	{
		title: 'Work schedule',
		href: '/dtr/settings',
		icon: CalendarClockIcon,
		match: 'exact'
	}
];

export function getDtrNavItems(role: string | null | undefined): AppNavItem[] {
	if (!canManageDtr(role)) {
		return [];
	}

	return DTR_NAV_ITEMS;
}
