import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';
import { canManagePayroll } from '$lib/shared/payroll/access';

export const PAYROLL_SETTINGS_NAV_ITEM: AppNavItem = {
	title: 'Settings',
	href: '/payroll/settings',
	icon: SOLAR.settings,
	match: 'prefix'
};

export const PAYROLL_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Overview',
		href: '/payroll',
		icon: SOLAR.payroll,
		match: 'exact'
	},
	{
		title: 'Employees',
		href: '/payroll/employees',
		icon: SOLAR.employees,
		match: 'prefix'
	},
	{
		title: 'Pay runs',
		href: '/payroll/runs',
		icon: SOLAR.payRuns,
		match: 'exact'
	}
];

export function getPayrollNavItems(role: string | null | undefined): AppNavItem[] {
	if (!canManagePayroll(role)) {
		return [];
	}

	return PAYROLL_NAV_ITEMS;
}
