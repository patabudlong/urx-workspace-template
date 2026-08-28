import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';
import { canManageAccounting } from '$lib/shared/accounting/access';

export const ACCOUNTING_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Overview',
		href: '/accounting',
		icon: SOLAR.accounting,
		match: 'exact'
	},
	{
		title: 'Chart of accounts',
		href: '/accounting/chart-of-accounts',
		icon: SOLAR.layers,
		match: 'exact'
	},
	{
		title: 'Journals',
		href: '/accounting/journals',
		icon: SOLAR.payslips,
		match: 'prefix'
	},
	{
		title: 'Opening balances',
		href: '/accounting/opening-balances',
		icon: SOLAR.paySchedule,
		match: 'prefix'
	},
	{
		title: 'Fiscal periods',
		href: '/accounting/periods',
		icon: SOLAR.dtrDefault,
		match: 'exact'
	},
	{
		title: 'Trial balance',
		href: '/accounting/trial-balance',
		icon: SOLAR.activity,
		match: 'exact'
	},
	{
		title: 'Settings',
		href: '/accounting/settings',
		icon: SOLAR.settings,
		match: 'exact'
	}
];

export function getAccountingNavItems(role: string | null | undefined): AppNavItem[] {
	return canManageAccounting(role) ? ACCOUNTING_NAV_ITEMS : [];
}
