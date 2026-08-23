import type { AppNavItem } from '$lib/navigation/app-nav';
import CalendarRangeIcon from '@lucide/svelte/icons/calendar-range';
import BriefcaseIcon from '@lucide/svelte/icons/briefcase';
import MinusCircleIcon from '@lucide/svelte/icons/minus-circle';

export const PAYROLL_SETTINGS_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Pay schedule',
		href: '/payroll/settings',
		icon: CalendarRangeIcon,
		match: 'exact'
	},
	{
		title: 'Job titles',
		href: '/payroll/settings/job-titles',
		icon: BriefcaseIcon,
		match: 'exact'
	},
	{
		title: 'Deductions',
		href: '/payroll/settings/deductions',
		icon: MinusCircleIcon,
		match: 'exact'
	}
];
