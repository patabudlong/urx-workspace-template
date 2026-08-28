import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';
import { canManageProjectManagement } from '$lib/shared/project-management/access';

export const PM_SETTINGS_NAV_ITEM: AppNavItem = {
	title: 'Settings',
	href: '/project-management/settings',
	icon: SOLAR.settings,
	match: 'exact'
};

export const PM_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Overview',
		href: '/project-management',
		icon: SOLAR.projectManagement,
		match: 'exact'
	},
	{
		title: 'Projects',
		href: '/project-management/projects',
		icon: SOLAR.layers,
		match: 'prefix'
	}
];

export function getProjectManagementNavItems(role: string | null | undefined): AppNavItem[] {
	return canManageProjectManagement(role) ? PM_NAV_ITEMS : [];
}
