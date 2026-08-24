import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';

export const PAYROLL_SETTINGS_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Pay schedule',
		href: '/payroll/settings',
		icon: SOLAR.paySchedule,
		match: 'exact'
	},
	{
		title: 'Job titles',
		href: '/payroll/settings/job-titles',
		icon: SOLAR.jobTitles,
		match: 'exact'
	},
	{
		title: 'Deductions',
		href: '/payroll/settings/deductions',
		icon: SOLAR.deductions,
		match: 'exact'
	}
];
