import type { Component } from 'svelte';
import ActivityIcon from '@lucide/svelte/icons/activity';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';

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
