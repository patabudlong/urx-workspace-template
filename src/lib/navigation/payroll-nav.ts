import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';
import { canManagePayroll, canViewOwnPayslips } from '$lib/shared/payroll/access';

export const PAYROLL_SETTINGS_NAV_ITEM: AppNavItem = {
	title: 'Settings',
	href: '/payroll/settings',
	icon: SOLAR.settings,
	match: 'prefix'
};

export const PAYROLL_ADMIN_NAV_ITEMS: AppNavItem[] = [
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
		match: 'prefix'
	},
	{
		title: 'Payslips',
		href: '/payroll/payslips',
		icon: SOLAR.payslips,
		match: 'prefix'
	}
];

export const PAYROLL_EMPLOYEE_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'My payslips',
		href: '/payroll/payslips',
		icon: SOLAR.payslips,
		match: 'prefix'
	}
];

/** @deprecated Use getPayrollNavItems */
export const PAYROLL_NAV_ITEMS = PAYROLL_ADMIN_NAV_ITEMS;

export function getPayrollNavItems(
	role: string | null | undefined,
	hasLinkedEmployee = false
): AppNavItem[] {
	if (canManagePayroll(role)) {
		return PAYROLL_ADMIN_NAV_ITEMS;
	}

	if (canViewOwnPayslips(role) && hasLinkedEmployee) {
		return PAYROLL_EMPLOYEE_NAV_ITEMS;
	}

	return [];
}
