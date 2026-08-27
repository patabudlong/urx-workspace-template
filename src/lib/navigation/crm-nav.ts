import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';
import { canManageCrm } from '$lib/shared/crm/access';

export const CRM_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Overview',
		href: '/crm',
		icon: SOLAR.crm,
		match: 'exact'
	},
	{
		title: 'Contacts',
		href: '/crm/contacts',
		icon: SOLAR.employees,
		match: 'exact'
	},
	{
		title: 'Companies',
		href: '/crm/companies',
		icon: SOLAR.jobTitles,
		match: 'exact'
	},
	{
		title: 'Deals',
		href: '/crm/deals',
		icon: SOLAR.payroll,
		match: 'exact'
	},
	{
		title: 'Settings',
		href: '/crm/settings',
		icon: SOLAR.settings,
		match: 'exact'
	}
];

export function getCrmNavItems(role: string | null | undefined): AppNavItem[] {
	return canManageCrm(role) ? CRM_NAV_ITEMS : [];
}
