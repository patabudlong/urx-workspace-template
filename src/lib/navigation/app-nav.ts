import type { Component } from 'svelte';
import ActivityIcon from '@lucide/svelte/icons/activity';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import CreditCardIcon from '@lucide/svelte/icons/credit-card';
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import ShieldIcon from '@lucide/svelte/icons/shield';
import UsersIcon from '@lucide/svelte/icons/users';
import UserCircleIcon from '@lucide/svelte/icons/user-circle';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';

export type AppNavItem = {
	title: string;
	href: string;
	icon: Component;
	external?: boolean;
	match?: 'exact' | 'prefix';
};

export type AppNavGroup = {
	label: string;
	items: AppNavItem[];
};

export const APP_NAV_GROUPS: AppNavGroup[] = [
	{
		label: 'Workspace',
		items: [
			{
				title: 'Overview',
				href: '/',
				icon: LayoutDashboardIcon,
				match: 'exact'
			},
			{
				title: 'Team',
				href: '/team',
				icon: UsersIcon,
				match: 'prefix'
			}
		]
	},
	{
		label: 'Resources',
		items: [
			{
				title: 'API Docs',
				href: '/docs',
				icon: BookOpenIcon,
				match: 'exact'
			},
			{
				title: 'Health Check',
				href: '/api/v1/health',
				icon: ActivityIcon,
				external: true,
				match: 'exact'
			}
		]
	}
];

export const USER_PROFILE_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Account',
		href: '/account',
		icon: UserCircleIcon,
		match: 'exact'
	},
	{
		title: 'Security',
		href: '/security',
		icon: ShieldIcon,
		match: 'exact'
	}
];

/** @deprecated Use USER_PROFILE_NAV_ITEMS or getProfileNavItems instead */
export const OWNER_PROFILE_NAV_ITEMS: AppNavItem[] = [
	...USER_PROFILE_NAV_ITEMS,
	{
		title: 'Billing',
		href: '/billing',
		icon: CreditCardIcon,
		match: 'exact'
	}
];

export const WORKSPACE_OWNER_PROFILE_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Billing',
		href: '/billing',
		icon: CreditCardIcon,
		match: 'exact'
	}
];

export function isAppNavActive(pathname: string, item: AppNavItem): boolean {
	if (item.match === 'prefix') {
		return pathname === item.href || pathname.startsWith(`${item.href}/`);
	}

	return pathname === item.href;
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
