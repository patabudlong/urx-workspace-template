import type { AppNavItem } from '$lib/navigation/app-nav';
import CalendarRangeIcon from '@lucide/svelte/icons/calendar-range';
import MinusCircleIcon from '@lucide/svelte/icons/minus-circle';

export const PAYROLL_SETTINGS_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Pay schedule',
		href: '/payroll/settings',
		icon: CalendarRangeIcon,
		match: 'exact'
	},
	{
		title: 'Deductions',
		href: '/payroll/settings/deductions',
		icon: MinusCircleIcon,
		match: 'exact'
	}
];
