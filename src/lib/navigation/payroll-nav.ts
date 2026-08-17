import type { AppNavItem } from '$lib/navigation/app-nav';
import { canManagePayroll } from '$lib/shared/payroll/access';
import BanknoteIcon from '@lucide/svelte/icons/banknote';
import CalendarRangeIcon from '@lucide/svelte/icons/calendar-range';

export const PAYROLL_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Overview',
		href: '/payroll',
		icon: BanknoteIcon,
		match: 'exact'
	},
	{
		title: 'Pay runs',
		href: '/payroll/runs',
		icon: CalendarRangeIcon,
		match: 'exact'
	}
];

export function getPayrollNavItems(role: string | null | undefined): AppNavItem[] {
	if (!canManagePayroll(role)) {
		return [];
	}

	return PAYROLL_NAV_ITEMS;
}
