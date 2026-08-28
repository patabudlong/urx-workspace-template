import { SOLAR } from '$lib/icons/solar-icons';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import {
	isWorkspacePackageEnabled,
	type WorkspacePackageId
} from '$lib/shared/workspace-packages';

export type AppNavItem = {
	title: string;
	href: string;
	icon: string;
	external?: boolean;
	match?: 'exact' | 'prefix';
	/** When set, used instead of `href` for active-state matching. */
	activeHref?: string;
	/** Workspace package required to show this item. */
	packageId?: WorkspacePackageId;
};

export type AppNavGroup = {
	label: string;
	items: AppNavItem[];
};

const WORKSPACE_NAV_PRIORITY: Record<string, number> = {
	'/': 0,
	'/team': 1
};

function sortWorkspaceNavItems(items: AppNavItem[]): AppNavItem[] {
	return [...items].sort((a, b) => {
		const priorityA = WORKSPACE_NAV_PRIORITY[a.href] ?? 2;
		const priorityB = WORKSPACE_NAV_PRIORITY[b.href] ?? 2;
		return priorityA - priorityB;
	});
}

export const APP_NAV_GROUPS: AppNavGroup[] = [
	{
		label: 'Workspace',
		items: [
			{
				title: 'Overview',
				href: '/',
				icon: SOLAR.overview,
				match: 'exact'
			},
			{
				title: 'Team',
				href: '/team',
				icon: SOLAR.team,
				match: 'prefix'
			},
// urixoft-workspace-mailbox:start
			{
				title: 'Mailbox',
				// Link straight to INBOX — avoid /mailbox → redirect (double IMAP load).
				href: '/mailbox/INBOX',
				activeHref: '/mailbox',
				icon: SOLAR.mailbox,
				match: 'prefix',
				packageId: 'urixoft-workspace-mailbox'
			},
// urixoft-workspace-mailbox:end
// urixoft-workspace-payroll:start
			{
				title: 'Payroll',
				href: '/payroll',
				icon: SOLAR.payroll,
				match: 'prefix',
				packageId: 'urixoft-workspace-payroll'
			},
// urixoft-workspace-payroll:end
// urixoft-workspace-dtr:start
			{
				title: 'DTR',
				href: '/dtr',
				icon: SOLAR.dtr,
				match: 'prefix',
				packageId: 'urixoft-workspace-dtr'
			},
// urixoft-workspace-dtr:end
// urixoft-workspace-accounting:start
			{
				title: 'Accounting',
				href: '/accounting',
				icon: SOLAR.accounting,
				match: 'prefix',
				packageId: 'urixoft-workspace-accounting'
			},
// urixoft-workspace-accounting:end
// urixoft-workspace-crm:start
			{
				title: 'CRM',
				href: '/crm',
				icon: SOLAR.crm,
				match: 'prefix',
				packageId: 'urixoft-workspace-crm'
			},
// urixoft-workspace-crm:end
// urx-project_management-package:start
			{
				title: 'Projects',
				href: '/project-management',
				icon: SOLAR.projectManagement,
				match: 'prefix',
				packageId: 'urx-project_management-package'
			},
// urx-project_management-package:end
		]
	},
	{
		label: 'Resources',
		items: [
			{
				title: 'API Docs',
				href: '/docs',
				icon: SOLAR.apiDocs,
				match: 'exact'
			},
			{
				title: 'Health Check',
				href: '/api/v1/health',
				icon: SOLAR.health,
				external: true,
				match: 'exact'
			}
		]
	}
];

export function getAppNavGroups(enabledPackages: readonly string[] = []): AppNavGroup[] {
	return APP_NAV_GROUPS.map((group) => {
		const items = group.items.filter(
			(item) => !item.packageId || isWorkspacePackageEnabled(enabledPackages, item.packageId)
		);

		return {
			...group,
			items: group.label === 'Workspace' ? sortWorkspaceNavItems(items) : items
		};
	}).filter((group) => group.items.length > 0);
}

export const USER_PROFILE_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Account',
		href: '/account',
		icon: SOLAR.account,
		match: 'exact'
	},
	{
		title: 'Security',
		href: '/security/password',
		icon: SOLAR.security,
		match: 'prefix',
		activeHref: '/security'
	}
];

/** @deprecated Use USER_PROFILE_NAV_ITEMS or getProfileNavItems instead */
export const OWNER_PROFILE_NAV_ITEMS: AppNavItem[] = [
	...USER_PROFILE_NAV_ITEMS,
	{
		title: 'Billing',
		href: '/billing',
		icon: SOLAR.billing,
		match: 'exact'
	}
];

export const WORKSPACE_OWNER_PROFILE_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Billing',
		href: '/billing',
		icon: SOLAR.billing,
		match: 'exact'
	}
];

export function isAppNavActive(pathname: string, item: AppNavItem): boolean {
	const href = item.activeHref ?? item.href;

	if (item.match === 'prefix') {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	return pathname === href;
}

export function formatWorkspaceRole(role: string): string {
	if (role === 'owner') {
		return 'Owner';
	}

	if (role === 'member') {
		return 'Member';
	}

	return role.charAt(0).toUpperCase() + role.slice(1);
}

export function isWorkspaceOwner(role: string | null | undefined): boolean {
	return role === WORKSPACE_MEMBER_ROLES.OWNER;
}

export function getProfileNavItems(workspaceRole: string | null | undefined): AppNavItem[] {
	const items = [...USER_PROFILE_NAV_ITEMS];

	if (isWorkspaceOwner(workspaceRole)) {
		items.push(...WORKSPACE_OWNER_PROFILE_NAV_ITEMS);
	}

	return items;
}

/** @deprecated Use getProfileNavItems instead */
export function getOwnerProfileNavItems(workspaceRole: string | null | undefined): AppNavItem[] {
	return getProfileNavItems(workspaceRole);
}
